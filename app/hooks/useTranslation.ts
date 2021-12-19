import { useCallback } from 'react';

// Mock translation
export function useTranslation() {
  const t = useCallback((s: string, d?: any) => s, []);
  return { t };
}
