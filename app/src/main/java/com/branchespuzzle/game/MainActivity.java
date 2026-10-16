package com.branchespuzzle.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
    private static final String TAG = "Branches";

    private WebView web;
    private FrameLayout bannerHolder;
    private AdView adView;
    private RewardedAd rewardedAd;
    private boolean rewardedLoading = false;
    private boolean earned = false;
    private final AtomicBoolean adsStarted = new AtomicBoolean(false);

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#BFE6FB"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#BFE6FB"));
        root.addView(web, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        bannerHolder = new FrameLayout(this);
        root.addView(bannerHolder, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        setContentView(root);

        // Android 15+ draws edge-to-edge; keep the game clear of the system bars.
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // level progress is saved in localStorage
        s.setAllowFileAccess(true);            // needed to read the bundled game page
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        // The game page is local; anything else (the contact email link, web links) opens in the phone's own apps.
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme())) return false;
                Intent intent = "mailto".equals(uri.getScheme())
                        ? new Intent(Intent.ACTION_SENDTO, uri)
                        : new Intent(Intent.ACTION_VIEW, uri);
                try { startActivity(intent); } catch (ActivityNotFoundException e) { Log.w(TAG, "No app for " + uri.getScheme()); }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("file:///android_asset/index.html");

        startConsentThenAds();
    }

    /* ---------- consent (required for EEA/UK users) then ads ---------- */
    private void startConsentThenAds() {
        final ConsentInformation info = UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        info.requestConsentInfoUpdate(this, params,
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, formError -> {
                    if (formError != null) Log.w(TAG, "Consent form: " + formError.getMessage());
                    if (info.canRequestAds()) startAds();
                }),
                requestError -> {
                    Log.w(TAG, "Consent info: " + requestError.getMessage());
                    if (info.canRequestAds()) startAds();
                });
        // If a previous session already collected consent, don't wait for the network.
        if (info.canRequestAds()) startAds();
    }

    private void startAds() {
        if (!adsStarted.compareAndSet(false, true)) return;
        MobileAds.initialize(this, status -> runOnUiThread(() -> {
            loadBanner();
            loadRewarded();
        }));
    }

    private void loadBanner() {
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int widthDp = (int) (dm.widthPixels / dm.density);
        adView = new AdView(this);
        adView.setAdUnitId(getString(R.string.banner_unit_id));
        adView.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, widthDp));
        bannerHolder.removeAllViews();
        bannerHolder.addView(adView);
        adView.loadAd(new AdRequest.Builder().build());
    }

    private void loadRewarded() {
        if (rewardedAd != null || rewardedLoading) return;
        rewardedLoading = true;
        RewardedAd.load(this, getString(R.string.rewarded_unit_id), new AdRequest.Builder().build(),
                new RewardedAdLoadCallback() {
                    @Override public void onAdLoaded(RewardedAd ad) {
                        rewardedAd = ad;
                        rewardedLoading = false;
                    }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        Log.w(TAG, "Rewarded failed: " + error.getMessage());
                        rewardedAd = null;
                        rewardedLoading = false;
                    }
                });
    }

    private void js(final String code) {
        runOnUiThread(() -> web.evaluateJavascript(code, null));
    }

    private void showRewarded() {
        if (rewardedAd == null) {
            loadRewarded();
            js("window.onRewardUnavailable && window.onRewardUnavailable()");
            return;
        }
        final RewardedAd ad = rewardedAd;
        rewardedAd = null;
        earned = false;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdDismissedFullScreenContent() {
                if (earned) js("window.onReward && window.onReward()");
                else js("window.onRewardDismissed && window.onRewardDismissed()");
                loadRewarded();
            }
            @Override public void onAdFailedToShowFullScreenContent(AdError e) {
                loadRewarded();
                js("window.onRewardUnavailable && window.onRewardUnavailable()");
            }
        });
        ad.show(this, rewardItem -> earned = true);
    }

    /** Methods the game page can call as Android.xxx() */
    private class Bridge {
        @JavascriptInterface
        public void showRewarded() {
            runOnUiThread(MainActivity.this::showRewarded);
        }
    }

    @Override protected void onPause() { if (adView != null) adView.pause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (adView != null) adView.resume(); }
    @Override protected void onDestroy() {
        if (adView != null) adView.destroy();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
