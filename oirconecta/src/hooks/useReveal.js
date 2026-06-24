/**
 * useReveal — hook minimalista que entrega un ref + un boolean "visible"
 * cuando el elemento entra por primera vez al viewport. Sin libs externas.
 *
 * Uso:
 *   const { ref, visible } = useReveal({ threshold: 0.2 });
 *   <Box ref={ref} sx={{ opacity: visible ? 1 : 0, transition: '...' }} />
 */
import { useEffect, useRef, useState } from 'react';

export function useReveal({ threshold = 0.18, once = true, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) io.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, visible };
}
