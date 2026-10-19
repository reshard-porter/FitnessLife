// src/native/watchBridge.ts
// WatchConnectivity bridge between the Capacitor iOS WebView and a SwiftUI watch app.
// @capacitor-community/apple-watch covers declarative watch UI + data pushes;
// for raw sendMessage / updateApplicationContext we register a small custom plugin
// (Swift side below). Both can live in the same project.
import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface WorkoutContext {
  phase: 'idle' | 'prep' | 'work' | 'rest' | 'done';
  intervalIndex: number;
  remaining: number;
  exercise: string;
  heartRate: number;
  zone: 1 | 2 | 3 | 4 | 5;
  music: { trackId: number; bpm: number; volume: number; playing: boolean; auto: boolean };
}

export type WatchCommand =
  | { cmd: 'TOGGLE_PLAY' } | { cmd: 'SKIP' } | { cmd: 'LAP' }
  | { cmd: 'VOLUME'; value: number } | { cmd: 'BPM_NUDGE'; delta: number }
  | { cmd: 'ZONE_OVERRIDE'; zone: number | null } | { cmd: 'TRACK'; index: number }
  | { cmd: 'HR'; bpm: number };

export interface WatchBridgePlugin {
  status(): Promise<{ paired: boolean; installed: boolean; reachable: boolean }>;
  updateApplicationContext(o: { context: WorkoutContext }): Promise<void>;
  sendMessage(o: { message: Record<string, unknown> }): Promise<{ reply?: Record<string, unknown> }>;
  addListener(e: 'watchCommand', cb: (c: WatchCommand) => void): Promise<PluginListenerHandle>;
}

export const WatchBridge = registerPlugin<WatchBridgePlugin>('WatchBridge');

// Phone -> Watch: latest-state-wins. Delivered even if the watch app wakes later.
export const pushContext = (context: WorkoutContext) =>
  WatchBridge.updateApplicationContext({ context });

// Phone -> Watch: immediate, only while reachable (e.g. haptic on interval change).
export const pingWatch = (message: Record<string, unknown>) =>
  WatchBridge.sendMessage({ message }).catch(() => pushContext as unknown);

// Watch -> Phone: commands from the wrist feed the same reducer the phone UI uses.
export const onWatchCommand = (dispatch: (c: WatchCommand) => void) =>
  WatchBridge.addListener('watchCommand', dispatch);
