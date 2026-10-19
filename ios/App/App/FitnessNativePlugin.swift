import Foundation
import UIKit
import AVFoundation
import Capacitor

/// Native helpers for FitnessLife:
/// - duckOthers / unduckOthers: lower Spotify or Apple Music while the voice coach speaks, then restore them.
/// - canOpenURL / openURL: detect the Spotify app and open Spotify links in it.
@objc(FitnessNativePlugin)
public class FitnessNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FitnessNativePlugin"
    public let jsName = "FitnessNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "duckOthers", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unduckOthers", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "canOpenURL", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openURL", returnType: CAPPluginReturnPromise)
    ]

    @objc func duckOthers(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers, .duckOthers])
        try? session.setActive(true)
        call.resolve()
    }

    @objc func unduckOthers(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        // Deactivating with notifyOthersOnDeactivation tells Spotify it can return to full volume.
        try? session.setActive(false, options: .notifyOthersOnDeactivation)
        try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)
        call.resolve()
    }

    @objc func canOpenURL(_ call: CAPPluginCall) {
        guard let value = call.getString("url"), let url = URL(string: value) else {
            call.reject("url is required")
            return
        }
        DispatchQueue.main.async {
            call.resolve(["value": UIApplication.shared.canOpenURL(url)])
        }
    }

    @objc func openURL(_ call: CAPPluginCall) {
        guard let value = call.getString("url"), let url = URL(string: value) else {
            call.reject("url is required")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { completed in
                call.resolve(["completed": completed])
            }
        }
    }
}
