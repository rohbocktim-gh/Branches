import SwiftUI
import UIKit

/// The iOS app is a thin shell around the same game page the Android app loads.
@main
struct BranchesApp: App {
    var body: some Scene {
        WindowGroup {
            GameScreen()
                .ignoresSafeArea()
        }
    }
}

struct GameScreen: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> GameViewController { GameViewController() }
    func updateUIViewController(_ vc: GameViewController, context: Context) {}
}
