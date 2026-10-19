// WatchApp/PhoneLink.swift  (SwiftUI watch app target)

import SwiftUI
import WatchConnectivity

final class PhoneLink: NSObject, ObservableObject, WCSessionDelegate {
  static let shared = PhoneLink()
  @Published var context: [String: Any] = [:]

  override init() {
    super.init()
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ command: [String: Any]) {
    guard WCSession.default.isReachable else { return }
    WCSession.default.sendMessage(command, replyHandler: nil)
  }

  func session(_ s: WCSession, didReceiveApplicationContext ctx: [String: Any]) {
    DispatchQueue.main.async { self.context = ctx }
  }
  func session(_ s: WCSession, activationDidCompleteWith st: WCSessionActivationState, error: Error?) {}
}

// Action button / Digital Crown wiring in a SwiftUI view:
//   .digitalCrownRotation($volume, from: 0, through: 1, by: 0.02)
//   .onChange(of: volume) { _, v in PhoneLink.shared.send(["cmd": "VOLUME", "value": v]) }
//   Button("Lap") { WKInterfaceDevice.current().play(.click); PhoneLink.shared.send(["cmd": "LAP"]) }
