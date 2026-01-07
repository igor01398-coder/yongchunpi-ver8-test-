
export type SoundType = 'click' | 'success' | 'error' | 'start';

// Using consistent sound effects from reliable CDNs or placeholders
const SOUNDS: Record<SoundType, string> = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Mechanical Click
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success Chime
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Error Buzzer
  start: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Sci-fi Start
};

let isSfxEnabled = true;

export const setSfxEnabled = (enabled: boolean) => {
  isSfxEnabled = enabled;
};

export const playSfx = (type: SoundType) => {
  if (!isSfxEnabled) return;

  try {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    // We catch the promise rejection that happens if the user hasn't interacted with the page yet
    audio.play().catch(e => {
        // Silent fail is acceptable for SFX
        // console.warn("Audio play failed (user interaction required):", e);
    });
  } catch (e) {
    console.warn("Audio system error", e);
  }
};
