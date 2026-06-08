/**
 * Hook que detecta si la URL trae ?preview_mode=true.
 * En ese modo, los slots publicitarios renderizan placeholders cuando
 * están vacíos y un overlay con badge "ACTIVO" cuando hay campaña.
 */
import { useEffect, useState } from 'react';

const KEY = 'oc_preview_mode';
const FOCUS_KEY = 'oc_preview_focus_slot';

export function usePreviewMode() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('preview_mode') === 'true';
      const fromSession = sessionStorage.getItem(KEY) === 'true';
      if (fromUrl) sessionStorage.setItem(KEY, 'true');
      setEnabled(fromUrl || fromSession);
    } catch {}
  }, []);
  return enabled;
}

/** Devuelve el slotId resaltado en preview (focus_slot query param). */
export function usePreviewFocusSlot() {
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('focus_slot');
      if (fromUrl) {
        sessionStorage.setItem(FOCUS_KEY, fromUrl);
        setSlot(fromUrl);
      } else {
        setSlot(sessionStorage.getItem(FOCUS_KEY) || null);
      }
    } catch {}
  }, []);
  return slot;
}
