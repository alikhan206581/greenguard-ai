"use client";
import { useEffect, useRef, useState } from "react";

/** Animates presentation only; the original API value remains unchanged. */
export function AnimatedNumber({ value, decimals = 0, suffix = "", signed = false }: { value: number | null | undefined; decimals?: number; suffix?: string; signed?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number | null>(null);
  const valid = typeof value === "number" && Number.isFinite(value);
  useEffect(() => {
    if (!valid || value == null) { setDisplay(null); return; }
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animate = () => {
      if (motion.matches) { setDisplay(value); return; }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / 1100, 1);
        setDisplay(value * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { animate(); observer.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, valid]);
  const format = (n: number) => `${signed && n > 0 ? "+" : ""}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return <span ref={ref} className="tabular-nums" aria-label={valid ? format(value!) : "Not available"}><span aria-hidden="true">{valid ? format(display ?? 0) : "—"}</span></span>;
}
