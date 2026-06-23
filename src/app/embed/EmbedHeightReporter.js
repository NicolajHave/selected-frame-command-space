"use client";
import { useEffect } from "react";

// Posts the document's full height to the parent window so an embedding host
// can resize the iframe to match — no scrollbars inside the iframe. The host
// listens for postMessage with type "selected-frame-intake:height".
//
// Uses ResizeObserver + a debounced fallback for safety in older browsers.

export default function EmbedHeightReporter() {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;

    let lastH = 0;
    const send = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
      );
      if (h !== lastH) {
        lastH = h;
        window.parent.postMessage(
          { type: "selected-frame-intake:height", height: h },
          "*",
        );
      }
    };

    send();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(send);
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    }
    const onLoad = () => send();
    window.addEventListener("load", onLoad);
    // Catch dynamic content (conditional fields, file lists) that may not
    // trigger ResizeObserver synchronously.
    const interval = setInterval(send, 800);

    return () => {
      ro?.disconnect();
      window.removeEventListener("load", onLoad);
      clearInterval(interval);
    };
  }, []);

  return null;
}
