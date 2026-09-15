package com.azatechnologies.aza;


import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.animation.DecelerateInterpolator;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String APP_URL = "https://a-za.vercel.app";
    private static final String APP_HOST = "a-za.vercel.app";
    private static final long EXIT_CONFIRM_WINDOW_MS = 2000;
    private static final String AUTH_CALLBACK_SCHEME = "com.azatechnologies.aza";
    private static final String AUTH_CALLBACK_HOST = "auth-callback";

    private LinearLayout loadingOverlay;
    private LinearLayout errorState;
    private Button retryButton;
    private ProgressBar loadingBar;
    private TextView errorMessage;
    private View logoView;
    private long lastBackPressTime = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View overlay = getLayoutInflater().inflate(R.layout.overlay_loading, null);
        loadingOverlay = overlay.findViewById(R.id.loadingOverlay);
        errorState = overlay.findViewById(R.id.errorState);
        retryButton = overlay.findViewById(R.id.retryButton);
        loadingBar = overlay.findViewById(R.id.loadingBar);
        errorMessage = overlay.findViewById(R.id.errorMessage);
        logoView = overlay.findViewById(R.id.logoImage);

        addContentView(overlay, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
        ));

        logoView.setAlpha(0f);
        ObjectAnimator fadeIn = ObjectAnimator.ofFloat(logoView, "alpha", 0f, 1f);
        fadeIn.setDuration(600);
        fadeIn.setInterpolator(new DecelerateInterpolator());
        fadeIn.start();

        retryButton.setOnClickListener(v -> loadAppUrl());

        bridge.getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                hideLoadingOverlay();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                showError("Connection failed. Tap Retry.");
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                if (scheme == null) {
                    return false;
                }
                boolean isWebScheme = scheme.equals("http") || scheme.equals("https");
                if (isWebScheme) {
                    String host = request.getUrl().getHost();
                    String path = request.getUrl().getPath();
                    boolean isGoogleAuth = "accounts.google.com".equals(host);
                    // /auth/native-start must ALSO be intercepted, not just
                    // accounts.google.com: the whole point of this page is to
                    // run signInWithOAuth() and exchangeCodeForSession() in the
                    // SAME browser context throughout, so the code_verifier
                    // PKCE writes to storage is readable when the exchange
                    // happens later in that same flow. If this first navigation
                    // were left to load inside the WebView, the verifier would
                    // end up in the WebView's storage instead, and the same
                    // storage-boundary bug this exists to fix would reappear —
                    // just moved one step earlier.
                    boolean isNativeAuthStart = APP_HOST.equals(host) && path != null
                            && path.equals("/auth/native-start");
                    if (isGoogleAuth || isNativeAuthStart) {
                        // Hand this off to the system browser instead of letting
                        // the WebView load it; the browser completes the OAuth
                        // flow and redirects back via the custom-scheme deep
                        // link handled in onNewIntent()/onCreate() below.
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                            startActivity(intent);
                        } catch (ActivityNotFoundException e) {
                            Toast.makeText(MainActivity.this, "No app found to handle this link.", Toast.LENGTH_SHORT).show();
                        }
                        return true;
                    }
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                    startActivity(intent);
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(MainActivity.this, "No app found to handle this link.", Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = bridge.getWebView();
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return;
                }

                long now = System.currentTimeMillis();
                if (now - lastBackPressTime < EXIT_CONFIRM_WINDOW_MS) {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                } else {
                    lastBackPressTime = now;
                    Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT).show();
                }
            }
        });

        loadAppUrl();

        // Cold-start case: the app was launched fresh by the auth-callback
        // deep link (system browser handed control back to us), rather than
        // already being in memory. getIntent() carries that launch intent.
        handleAuthCallbackIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Warm-start case: MainActivity is singleTask and already running,
        // so the auth-callback deep link arrives here instead of onCreate().
        setIntent(intent);
        handleAuthCallbackIntent(intent);
    }

    private void handleAuthCallbackIntent(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri == null) return;
        if (!AUTH_CALLBACK_SCHEME.equals(uri.getScheme()) || !AUTH_CALLBACK_HOST.equals(uri.getHost())) {
            return;
        }

        // Google sign-in completes via Supabase's PKCE authorization-code
        // flow, run ENTIRELY inside the system browser: /auth/native-start
        // (opened by shouldOverrideUrlLoading above, same as
        // accounts.google.com) calls signInWithOAuth(), the resulting
        // Google consent hop is also intercepted the same way, and
        // Google's redirect lands on /auth/native-google-return — still
        // in that same browser tab/context — which calls
        // exchangeCodeForSession() using a client that can actually see
        // the verifier, because nothing crossed a storage boundary at any
        // point in that chain. That page then hands the FINISHED session
        // (access_token + refresh_token, not a code, not an id_token) here
        // via this deep link, so the WebView's own Supabase client can
        // just call setSession() with them directly.
        String accessToken = uri.getQueryParameter("access_token");
        String refreshToken = uri.getQueryParameter("refresh_token");
        if (accessToken == null || refreshToken == null) return;

        String next = uri.getQueryParameter("next");
        if (next == null) next = "/";

        Uri.Builder builder = Uri.parse(APP_URL + "/auth/set-session").buildUpon()
                .appendQueryParameter("access_token", accessToken)
                .appendQueryParameter("refresh_token", refreshToken)
                .appendQueryParameter("next", next);

        bridge.getWebView().loadUrl(builder.build().toString());
    }

    private void loadAppUrl() {
        if (!isNetworkAvailable()) {
            showError("No internet connection. Tap Retry.");
            return;
        }

        errorState.setVisibility(View.GONE);
        loadingBar.setVisibility(View.VISIBLE);
        loadingOverlay.setVisibility(View.VISIBLE);
        loadingOverlay.setAlpha(1f);

        bridge.getWebView().loadUrl(APP_URL);
    }

    private void hideLoadingOverlay() {
        ObjectAnimator fadeOut = ObjectAnimator.ofFloat(loadingOverlay, "alpha", 1f, 0f);
        fadeOut.setDuration(400);
        fadeOut.setInterpolator(new DecelerateInterpolator());
        fadeOut.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                loadingOverlay.setVisibility(View.GONE);
            }
        });
        fadeOut.start();
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm == null) return false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.net.Network nw = cm.getActiveNetwork();
            if (nw == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(nw);
            return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } else {
            android.net.NetworkInfo netInfo = cm.getActiveNetworkInfo();
            return netInfo != null && netInfo.isConnected();
        }
    }

    private void showError(String msg) {
        loadingBar.setVisibility(View.GONE);
        errorState.setVisibility(View.VISIBLE);
        errorMessage.setText(msg);
    }
}
