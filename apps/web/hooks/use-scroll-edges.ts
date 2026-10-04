"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FADE = "calc(var(--spacing) * 8)";

export function edgeMask(start: boolean, end: boolean): React.CSSProperties {
  if (!start && !end) return {};
  const from = start ? `transparent, black ${FADE}` : "black, black";
  const to = end ? `black calc(100% - ${FADE}), transparent` : "black, black";
  const mask = `linear-gradient(to right, ${from}, ${to})`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const start = element.scrollLeft > 4;
    const end =
      element.scrollLeft + element.clientWidth < element.scrollWidth - 4;
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end },
    );
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  return { ref, measure, style: edgeMask(edges.start, edges.end) };
}
