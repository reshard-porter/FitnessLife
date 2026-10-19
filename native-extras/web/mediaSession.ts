// src/native/mediaSession.ts
// Lock-screen / Control Center transport controls for the synthesized workout mix.
type Handlers = { play: () => void; pause: () => void; nexttrack: () => void; previoustrack: () => void };

export function bindLockScreen(title: string, genre: string, h: Handlers) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title, artist: 'FitnessLife', album: genre,
  });
  (Object.keys(h) as MediaSessionAction[]).forEach((action) => {
    try { navigator.mediaSession.setActionHandler(action, h[action as keyof Handlers]); } catch {}
  });
}

export const setPlaybackState = (playing: boolean) => {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
};
