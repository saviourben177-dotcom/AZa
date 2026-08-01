package com.azatechnologies.aza;

import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
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

    private LinearLayout errorOverlay;
    private Button retryButton;
    private ProgressBar loadingBar;
    private TextView errorMessage;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View overlay = getLayoutInflater().inflate(R.layout.overlay_error, null);
        errorOverlay = overlay.findViewById(R.id.errorOverlay);
        retryButton = overlay.findViewById(R.id.retryButton);
        loadingBar = overlay.findViewById(R.id.loadingBar);
        errorMessage = overlay.findViewById(R.id.errorMessage);

        addContentView(overlay, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
        ));

        retryButton.setOnClickListener(v -> loadAppUrl());

        bridge.getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                errorOverlay.setVisibility(View.GONE);
                loadingBar.setVisibility(View.GONE);
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

        loadingBar.setVisibility(View.VISIBLE);
        errorOverlay.setVisibility(View.GONE);

        bridge.getWebView().loadUrl(APP_URL);
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
        errorOverlay.setVisibility(View.VISIBLE);
        errorMessage.setText(msg);
    }
}
