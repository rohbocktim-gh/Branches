import UIKit
import WebKit

/// The game page in a web view, with the banner ad underneath.
/// The page talks to the app through `window.Android.showRewarded()`, the same call it makes
/// on Android, so the game itself needs no changes for iOS.
final class GameViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private let sky = UIColor(red: 0xBF / 255.0, green: 0xE6 / 255.0, blue: 0xFB / 255.0, alpha: 1)
    private var web: WKWebView!
    let bannerHolder = UIView()
    private lazy var ads = Ads(host: self)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = sky

        let config = WKWebViewConfiguration()
        // Same name and method the Android app provides, so the page finds its ad button.
        let shim = """
        window.Android = { showRewarded: function () { window.webkit.messageHandlers.ads.postMessage('showRewarded'); } };
        """
        config.userContentController.addUserScript(WKUserScript(source: shim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController.add(self, name: "ads")
        config.mediaTypesRequiringUserActionForPlayback = []

        web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = sky
        web.scrollView.backgroundColor = sky
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.bounces = false
        web.navigationDelegate = self

        let stack = UIStackView(arrangedSubviews: [web, bannerHolder])
        stack.axis = .vertical
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            stack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        if let page = Bundle.main.url(forResource: "index", withExtension: "html") {
            web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        ads.start()
    }

    /// Runs a line of JavaScript in the page (the reward callbacks).
    func js(_ code: String) {
        web.evaluateJavaScript(code, completionHandler: nil)
    }

    // The page asked for a rewarded video.
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "ads", (message.body as? String) == "showRewarded" { ads.showRewarded() }
    }

    // The game page is local; the contact email link and web links open in the device's own apps.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.allow) }
        if url.isFileURL || url.scheme == "about" { return decisionHandler(.allow) }
        if action.navigationType == .linkActivated || url.scheme == "mailto" {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }
}
