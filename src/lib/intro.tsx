"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type IntroState = { done: boolean; finish: () => void };
const IntroContext = createContext<IntroState>({ done: true, finish: () => {} });

export function IntroProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  const finish = useCallback(() => setDone(true), []);
  const value = useMemo(() => ({ done, finish }), [done, finish]);
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export const useIntro = () => useContext(IntroContext);
