import { useEffect, useRef } from "react";

// วิดเจ็ต Cloudflare Turnstile — เรียก onToken(token) เมื่อผ่าน / onToken("") เมื่อหมดอายุหรือ error
export default function TurnstileWidget({ siteKey, onToken }) {
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const cbRef = useRef(onToken);
  cbRef.current = onToken;

  useEffect(() => {
    if (!siteKey) return;
    let stopped = false;
    let timer = null;

    const render = () => {
      if (stopped || !boxRef.current || widgetId.current != null) return;
      if (!window.turnstile) return false;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: siteKey,
        callback: (t) => cbRef.current?.(t),
        "expired-callback": () => cbRef.current?.(""),
        "error-callback": () => cbRef.current?.(""),
      });
      return true;
    };

    if (!render()) {
      timer = setInterval(() => { if (render() !== false) clearInterval(timer); }, 200);
    }

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      try { if (widgetId.current != null && window.turnstile) window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
      widgetId.current = null;
    };
  }, [siteKey]);

  return <div ref={boxRef} className="flex min-h-[65px] justify-center" />;
}
