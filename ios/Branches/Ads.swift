import GoogleMobileAds
import UIKit
import UserMessagingPlatform

/// AdMob for Branches on iOS: consent first (required in the EEA and UK), then a banner
/// under the game and one rewarded video kept loaded for the "+30 petals" button.
final class Ads: NSObject, FullScreenContentDelegate {
    private weak var host: GameViewController?
    private var started = false
    private var banner: BannerView?
    private var rewarded: RewardedAd?
    private var rewardedLoading = false
    private var earned = false

    private let bannerID = Bundle.main.object(forInfoDictionaryKey: "BranchesBannerUnitID") as? String ?? ""
    private let rewardedID = Bundle.main.object(forInfoDictionaryKey: "BranchesRewardedUnitID") as? String ?? ""

    init(host: GameViewController) { self.host = host }

    func start() {
        guard !started, let host else { return }
        started = true
        ConsentInformation.shared.requestConsentInfoUpdate(with: RequestParameters()) { [weak self] _ in
            ConsentForm.loadAndPresentIfRequired(from: host) { _ in
                if ConsentInformation.shared.canRequestAds { self?.startAds() }
            }
        }
        // A previous session may already have consent; don't wait for the network.
        if ConsentInformation.shared.canRequestAds { startAds() }
    }

    private var adsStarted = false
    private func startAds() {
        guard !adsStarted else { return }
        adsStarted = true
        MobileAds.shared.start { [weak self] _ in
            DispatchQueue.main.async {
                self?.loadBanner()
                self?.loadRewarded()
            }
        }
    }

    private func loadBanner() {
        guard let host else { return }
        let width = host.view.bounds.width
        let b = BannerView(adSize: currentOrientationAnchoredAdaptiveBanner(width: width))
        b.adUnitID = bannerID
        b.rootViewController = host
        b.translatesAutoresizingMaskIntoConstraints = false
        host.bannerHolder.subviews.forEach { $0.removeFromSuperview() }
        host.bannerHolder.addSubview(b)
        NSLayoutConstraint.activate([
            b.centerXAnchor.constraint(equalTo: host.bannerHolder.centerXAnchor),
            b.topAnchor.constraint(equalTo: host.bannerHolder.topAnchor),
            b.bottomAnchor.constraint(equalTo: host.bannerHolder.bottomAnchor),
        ])
        b.load(Request())
        banner = b
    }

    private func loadRewarded() {
        guard rewarded == nil, !rewardedLoading else { return }
        rewardedLoading = true
        RewardedAd.load(with: rewardedID, request: Request()) { [weak self] ad, _ in
            DispatchQueue.main.async {
                self?.rewardedLoading = false
                self?.rewarded = ad
                ad?.fullScreenContentDelegate = self
            }
        }
    }

    func showRewarded() {
        guard let host, let ad = rewarded else {
            loadRewarded()
            host?.js("window.onRewardUnavailable && window.onRewardUnavailable()")
            return
        }
        rewarded = nil
        earned = false
        ad.present(from: host) { [weak self] in self?.earned = true }
    }

    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        host?.js(earned ? "window.onReward && window.onReward()"
                        : "window.onRewardDismissed && window.onRewardDismissed()")
        loadRewarded()
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        loadRewarded()
        host?.js("window.onRewardUnavailable && window.onRewardUnavailable()")
    }
}
