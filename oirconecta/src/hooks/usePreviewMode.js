/**
 * Hook que detecta si la URL trae ?preview_mode=true.
 * En ese modo, los slots publicitarios renderizan placeholders cuando
 * están vacíos y un overlay con badge "ACTIVO" cuando hay campaña.
 */
import { useEffect, useState } from 'react';

export function usePreviewMode() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setEnabled(params.get('preview_mode') === 'true');
    } catch {}
  }, []);
  return enabled;
}
