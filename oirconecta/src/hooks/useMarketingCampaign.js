/**
 * Hook compartido: poll campaña activa de un tipo, registrar impresión 1 vez
 * cuando entra al viewport, devolver helpers de click + URL con UTMs.
 *
 * Uso:
 *   const { camp, ref, onClick } = useMarketingCampaign('BANNER_FOOTER');
 *   if (!camp) return null;
 *   return <a ref={ref} onClick={onClick} ...>{camp.creativeUrl}...</a>
 */

import { useEffect, useRef, useState } from 'react';
import {
  fetchActiveCampaign, trackImpression, trackClick,
  buildDestinationUrl, rememberUtm,
} from '../services/marketingPublicApi';

const POLL_MS = 60 * 1000;

export function useMarketingCampaign(actionType, { device } = {}) {
  const [camp, setCamp] = useState(null);
  const impressedRef = useRef(false);
  const elRef = useRef(null);

  // Polling
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const c = await fetchActiveCampaign(actionType);
      if (!alive) return;
      // Filtro por device si campaign.config.device está set
      if (c && device && c.config?.device && c.config.device !== 'both' && c.config.device !== device) {
        setCamp(null);
        return;
      }
      setCamp(c);
      if (c) rememberUtm(c);
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [actionType, device]);

  // Tracking de impresión via IntersectionObserver
  useEffect(() => {
    if (!camp || !elRef.current || impressedRef.current) return;
    const el = elRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !impressedRef.current) {
        impressedRef.current = true;
        trackImpression(camp.id);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [camp]);

  const onClick = (e) => {
    if (!camp) return;
    trackClick(camp.id);
    const url = buildDestinationUrl(camp);
    if (url) {
      // Si el componente es <a> dejamos que abra normal; si no, abrimos manual.
      if (!(e?.currentTarget?.tagName === 'A')) {
        e?.preventDefault?.();
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return { camp, ref: elRef, onClick, href: buildDestinationUrl(camp) };
}
