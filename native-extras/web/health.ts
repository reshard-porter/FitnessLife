// src/native/health.ts
// Read/write HealthKit from the iPhone with @perfood/capacitor-healthkit.
// Sample-name strings map to HKQuantityTypeIdentifier values; confirm the exact
// keys against the README of the plugin version you install.
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit';

const READ  = ['heartRate', 'restingHeartRate', 'calories', 'activity'];
//              ^ HKQuantityTypeIdentifierHeartRate   ^ HKQuantityTypeIdentifierActiveEnergyBurned
const WRITE = ['calories', 'activity'];               // activity => HKWorkoutType

export async function requestHealthAccess() {
  await CapacitorHealthkit.requestAuthorization({ all: [], read: READ, write: WRITE });
}

export async function latestHeartRate(): Promise<number | undefined> {
  const end = new Date();
  const start = new Date(end.getTime() - 10 * 60 * 1000);
  const res = await CapacitorHealthkit.queryHKitSampleType<{ value: number }>({
    sampleName: 'heartRate',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    limit: 1,
  });
  return res.resultData?.[0]?.value;
}

// Info.plist
//   NSHealthShareUsageDescription  "Sworkit reads heart rate to set your training zone."
//   NSHealthUpdateUsageDescription "Sworkit saves workouts and active energy to Health."
// Xcode: Signing & Capabilities -> HealthKit (iOS target AND watch target)
