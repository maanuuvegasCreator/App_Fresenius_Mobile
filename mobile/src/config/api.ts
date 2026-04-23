import { NativeModules, Platform } from 'react-native';

import { DEV_USE_VERCEL_FOR_API } from './devApi';
import { PUBLIC_API_BASE_URL } from './productionUrl';

function getDevMachineHost(): string {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  if (typeof scriptURL === 'string') {
    const m = scriptURL.match(/\/\/([^:/]+)/);
    if (m?.[1]) {
      const host = m[1];
      if (host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

/**
 * En __DEV__ usa el PC (Metro). En release usa `PUBLIC_API_BASE_URL` (Vercel).
 */
export function getApiBaseUrl(): string {
  if (__DEV__ && DEV_USE_VERCEL_FOR_API) {
    return PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  if (__DEV__) {
    const host = getDevMachineHost();
    return `http://${host}:3000`;
  }
  const base = PUBLIC_API_BASE_URL.replace(/\/$/, '');
  if (base.includes('TU-PROYECTO')) {
    console.warn(
      '[api] Configura PUBLIC_API_BASE_URL en mobile/src/config/productionUrl.ts',
    );
  }
  return base;
}
