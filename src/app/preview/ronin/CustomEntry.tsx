"use client";

import { useEffect, useState } from "react";
import { CustomPreview } from "./CustomPreview";

/** Client-only mount (reads URL params). */
export function CustomEntry() {
  const [ok, setOk] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate
  useEffect(() => setOk(true), []);
  return ok ? <CustomPreview /> : null;
}
