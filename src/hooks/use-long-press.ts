"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A pointer-safe long press. The callback fires once after the configured hold. */
export function useLongPress(onLongPress: () => void, duration = 2000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPressing(false);
  }, []);

  const start = useCallback(() => {
    clear();
    setPressing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPressing(false);
      onLongPress();
    }, duration);
  }, [clear, duration, onLongPress]);

  useEffect(() => clear, [clear]);

  return {
    pressing,
    handlers: {
      onPointerDown: start,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}
