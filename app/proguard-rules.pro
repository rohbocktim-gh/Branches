# Keep the methods the web page calls through the JavaScript bridge.
-keepclassmembers class com.branchespuzzle.game.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
