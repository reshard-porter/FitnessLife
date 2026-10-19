import UIKit
import Capacitor

/// Hosts the FitnessLife web app and registers the app's own native plugin.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(FitnessNativePlugin())
    }
}
