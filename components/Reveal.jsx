"use client";

import { useEffect, useRef, useState } from "react";

/* The page's single authored gesture: content wipes up from its baseline as a
   printed sheet would, staggered along a row. Everything is legible without JS —
   the reveal only ever removes a transform, never gates content. */

export default function Reveal({ as: Tag = "div", index = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`u-reveal ${className}`}
      data-shown={shown ? "true" : "false"}
      style={{ "--i": index }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
