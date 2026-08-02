package com.azatechnologies.aza;

import com.yangatechnologies.aza.R;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
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

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String APP_URL = "https://a-za.vercel.app";

    private LinearLayout loadingOverlay;
    private LinearLayout errorState;
    private Button retryButton;
    private ProgressBar loadingBar;
    private TextView errorMessage;
    private View logoView;

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
                return false;
            }
        });

        loadAppUrl();
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
