import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "@/popup/hooks/useTranslation";

export interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

const LINE_CLAMP_CLASS: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export function ExpandableText({
  text,
  maxLines = 3,
  className = "",
}: ExpandableTextProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [clampedHeight, setClampedHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const lineClampClass = LINE_CLAMP_CLASS[maxLines] ?? "line-clamp-3";

  useLayoutEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    element.classList.remove(lineClampClass);
    const measuredFullHeight = element.scrollHeight;
    setFullHeight(measuredFullHeight);

    element.classList.add(lineClampClass);
    const measuredClampedHeight = element.clientHeight;
    setClampedHeight(measuredClampedHeight);
    setNeedsToggle(measuredFullHeight > measuredClampedHeight + 1);

    if (expanded) {
      element.classList.remove(lineClampClass);
    }
  }, [text, expanded, lineClampClass]);

  if (!text) return null;

  const toggleLabel =
    expanded ? t("showLess") : `... ${t("showMore")}`;

  return (
    <div className={className}>
      <div
        className="expandable-text-panel overflow-hidden"
        style={{
          maxHeight: expanded ? fullHeight : clampedHeight || undefined,
        }}
        aria-expanded={expanded}
      >
        <p
          ref={contentRef}
          className={`whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300 ${
            expanded ? "" : lineClampClass
          }`}
        >
          {text}
        </p>
      </div>

      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          aria-label={toggleLabel}
        >
          {toggleLabel}
        </button>
      )}
    </div>
  );
}
