"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  };
}

/** SSR-safe media query. Returns `fallback` on the server and first client paint. */
export function useMediaQuery(query: string, fallback = false) {
  const subscribe = useCallback((cb: () => void) => subscribeMedia(query)(cb), [query]);
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

/** True when the primary pointer is fine (mouse / trackpad). */
export function useFinePointer() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Detects WebGL support once on the client. `null` until known. */
export function useWebGLSupport() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let supported = false;
    try {
      const canvas = document.createElement("canvas");
      supported = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      supported = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability probe
    setOk(supported);
  }, []);
  return ok;
}

/** Live clock for a given IANA timezone, updated every 30s. */
export function useZonedTime(timeZone: string) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return now;
}
