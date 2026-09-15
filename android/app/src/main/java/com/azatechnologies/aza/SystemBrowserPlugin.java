package com.azatechnologies.aza;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Direct-launch path for opening the system browser, deliberately NOT
// going through the WebView at all. The old approach navigated the
// WebView itself (window.location.href) and relied on
// shouldOverrideUrlLoading in MainActivity to intercept that
// navigation and redirect it to Intent.ACTION_VIEW. That extra hop —
// WebView starts loading, then gets intercepted — is what this plugin
// removes: the JS calls this method directly, and Intent.ACTION_VIEW
// fires immediately, with the WebView never attempting to load the
// URL in the first place.
@CapacitorPlugin(name = "SystemBrowser")
public class SystemBrowserPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("Missing 'url'");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (ActivityNotFoundException e) {
            call.reject("No app found to handle this link.");
        }
    }
}
