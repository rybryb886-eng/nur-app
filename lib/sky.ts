import type { DayTimes } from './prayer';

export type SkyPhase = 'night' | 'dawn' | 'day' | 'golden' | 'sunset';

/** Background gradient (top to bottom) for each part of the day. */
export const SKY: Record<SkyPhase, { colors: [string, string, ...string[]]; accent: string; stars: boolean }> = {
  dawn: { colors: ['#3B3F7A', '#B3769E', '#F3A98C', '#FAD4B4'], accent: '#FFD9B8', stars: false },
  day: { colors: ['#2F7FD0', '#5FA8E8', '#A9D4F5', '#DDEFFB'], accent: '#FFFFFF', stars: false },
  golden: { colors: ['#3D78C2', '#7FA8D8', '#E9C38F', '#F5D7A4'], accent: '#FFE6B0', stars: false },
  sunset: { colors: ['#2B2560', '#6B3D8F', '#D2577A', '#F59A5B'], accent: '#FFC48A', stars: false },
  night: { colors: ['#050A24', '#0D1640', '#1D2A63', '#33407F'], accent: '#C9D3FF', stars: true },
};

export function skyPhase(times: DayTimes, now = new Date()): SkyPhase {
  const hour = 3600_000;
  if (now < times.fajr || now >= times.isha) return 'night';
  if (now < new Date(times.sunrise.getTime() + hour)) return 'dawn';
  if (now < times.asr) return 'day';
  if (now < new Date(times.maghrib.getTime() - 20 * 60_000)) return 'golden';
  return 'sunset';
}

export const GLASS = {
  bg: 'rgba(255,255,255,0.14)',
  bgStrong: 'rgba(255,255,255,0.24)',
  border: 'rgba(255,255,255,0.28)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.5)',
  success: '#7CF2B0',
};
