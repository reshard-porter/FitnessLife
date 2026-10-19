// WatchApp/WorkoutManager.swift — live HKWorkoutSession on the wrist
// The Capacitor plugin reads/writes samples; a live session with streaming
// heart rate runs on watchOS (HKWorkoutSession + HKLiveWorkoutBuilder).

import HealthKit

final class WorkoutManager: NSObject, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
  let store = HKHealthStore()
  private var session: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?
  private let heartRate = HKQuantityType(.heartRate)
  private let energy = HKQuantityType(.activeEnergyBurned)

  func authorize() async throws {
    try await store.requestAuthorization(toShare: [HKQuantityType.workoutType(), energy],
                                         read: [heartRate, energy])
  }

  func start() throws {
    let cfg = HKWorkoutConfiguration()
    cfg.activityType = .highIntensityIntervalTraining
    cfg.locationType = .indoor
    session = try HKWorkoutSession(healthStore: store, configuration: cfg)
    builder = session?.associatedWorkoutBuilder()
    builder?.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: cfg)
    session?.delegate = self
    builder?.delegate = self
    let now = Date()
    session?.startActivity(with: now)
    builder?.beginCollection(withStart: now) { _, _ in }
  }

  func pause()  { session?.pause() }
  func resume() { session?.resume() }
  func end() {
    session?.end()
    builder?.endCollection(withEnd: Date()) { _, _ in
      self.builder?.finishWorkout { _, _ in }
    }
  }

  func workoutBuilder(_ b: HKLiveWorkoutBuilder, didCollectDataOf types: Set<HKSampleType>) {
    let bpmUnit = HKUnit.count().unitDivided(by: .minute())
    if types.contains(heartRate),
       let bpm = b.statistics(for: heartRate)?.mostRecentQuantity()?.doubleValue(for: bpmUnit) {
      PhoneLink.shared.send(["cmd": "HR", "bpm": bpm])
    }
  }
  func workoutBuilderDidCollectEvent(_ b: HKLiveWorkoutBuilder) {}
  func workoutSession(_ s: HKWorkoutSession, didChangeTo to: HKWorkoutSessionState,
                      from: HKWorkoutSessionState, date: Date) {}
  func workoutSession(_ s: HKWorkoutSession, didFailWithError error: Error) {}
}
