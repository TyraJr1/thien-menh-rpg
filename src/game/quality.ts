export const qualities = {
  low: { label: 'Low', width: 640, fps: 24, fog: 0, particles: 0 },
  medium: { label: 'Medium', width: 800, fps: 30, fog: 1, particles: 7 },
  high: { label: 'High', width: 960, fps: 45, fog: 3, particles: 16 },
} as const;

export type Quality = keyof typeof qualities;
export type QualityPreference = 'auto' | Quality;

export function readQuality(): QualityPreference {
  try {
    const value = localStorage.getItem('thien-menh.quality');
    if (value === 'low' || value === 'medium' || value === 'high') return value;
  } catch { /* Storage can be disabled. */ }
  return 'auto';
}

export function autoQuality(): Quality {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const compact = matchMedia('(pointer: coarse)').matches || innerWidth < 720;
  if ((memory && memory <= 4) || navigator.hardwareConcurrency <= 4) return 'low';
  return compact || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'medium' : 'high';
}

export function saveQuality(quality: QualityPreference) {
  try {
    localStorage.setItem('thien-menh.quality', quality);
  } catch { /* Session quality still applies. */ }
}
