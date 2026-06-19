"use client";

import { useEffect, useState } from "react";

export function useDelayedLoadingMessage(
  isLoading: boolean,
  delayMs = 5000,
) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShouldShow(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldShow(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, isLoading]);

  return shouldShow;
}
