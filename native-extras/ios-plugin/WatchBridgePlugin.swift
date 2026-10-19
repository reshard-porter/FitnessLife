// ios/App/App/WatchBridgePlugin.swift

import Capacitor
import WatchConnectivity

@objc(WatchBridgePlugin)
public class WatchBridgePlugin: CAPPlugin, CAPBridgedPlugin, WCSessionDelegate {
  public let identifier = "WatchBridgePlugin"
  public let jsName = "WatchBridge"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "updateApplicationContext", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "sendMessage", returnType: CAPPluginReturnPromise)
  ]

  override public func load() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  @objc func status(_ call: CAPPluginCall) {
    let s = WCSession.default
    call.resolve(["paired": s.isPaired, "installed": s.isWatchAppInstalled, "reachable": s.isReachable])
  }

  @objc func updateApplicationContext(_ call: CAPPluginCall) {
    guard let ctx = call.getObject("context") else { return call.reject("context required") }
    do { try WCSession.default.updateApplicationContext(ctx as [String: Any]); call.resolve() }
    catch { call.reject(error.localizedDescription) }
  }

  @objc func sendMessage(_ call: CAPPluginCall) {
    guard WCSession.default.isReachable, let msg = call.getObject("message") else {
      return call.reject("Watch not reachable")
    }
    WCSession.default.sendMessage(msg as [String: Any],
      replyHandler: { reply in call.resolve(["reply": reply]) },
      errorHandler: { err in call.reject(err.localizedDescription) })
  }

  // Watch -> Phone
  public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    notifyListeners("watchCommand", data: message)
  }
  public func session(_ s: WCSession, activationDidCompleteWith st: WCSessionActivationState, error: Error?) {}
  public func sessionDidBecomeInactive(_ session: WCSession) {}
  public func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }
}
