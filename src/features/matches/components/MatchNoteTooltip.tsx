"use client";

import { useEffect, useRef, useState } from "react";
import { Tooltip } from "antd";

export function MatchNoteTooltip({ text }: { text: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const updateTruncation = () => {
      setIsTruncated(
        element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1,
      );
    };

    updateTruncation();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);

    return () => observer.disconnect();
  }, [text]);

  const content = (
    <span ref={textRef} className="match-detail-note" tabIndex={isTruncated ? 0 : undefined}>
      {text}
    </span>
  );

  if (!isTruncated) return content;

  return (
    <Tooltip
      title={text}
      placement="topLeft"
      rootClassName="match-detail-note-tooltip"
      trigger={["hover", "focus", "click"]}
    >
      {content}
    </Tooltip>
  );
}
