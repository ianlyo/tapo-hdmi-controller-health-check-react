import { ServerHealthStatus, StatusThemePalette } from '../types/health';

export const STATUS_PALETTES: Record<ServerHealthStatus, StatusThemePalette> = {
  [ServerHealthStatus.healthy]: {
    primary: '#10B981', // Emerald 500
    accent: '#34D399', // Emerald 400
    bgTop: '#04221A',
    bgBottom: '#060D0B',
    cardBg: '#09261E',
    cardBorder: '#10B981',
    iconName: 'checkmark-circle',
  },
  [ServerHealthStatus.degraded]: {
    primary: '#F59E0B', // Amber 500
    accent: '#FBBF24', // Amber 400
    bgTop: '#261905',
    bgBottom: '#0E0B06',
    cardBg: '#291D09',
    cardBorder: '#F59E0B',
    iconName: 'warning',
  },
  [ServerHealthStatus.unreachable]: {
    primary: '#EF4444', // Red 500
    accent: '#F87171', // Red 400
    bgTop: '#280909',
    bgBottom: '#0F0708',
    cardBg: '#2B1012',
    cardBorder: '#EF4444',
    iconName: 'close-circle',
  },
  [ServerHealthStatus.checking]: {
    primary: '#9E9E9E',
    accent: '#FFFFFF',
    bgTop: '#181818',
    bgBottom: '#000000',
    cardBg: '#141414',
    cardBorder: '#2E2E2E',
    iconName: 'sync-circle',
  },
};

export function getStatusPalette(status: ServerHealthStatus): StatusThemePalette {
  return STATUS_PALETTES[status] || STATUS_PALETTES[ServerHealthStatus.checking];
}
