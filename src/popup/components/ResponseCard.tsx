import type { ReactNode } from "react";

interface ResponseCardProps {
  title: string;
  children: ReactNode;
  accent?: "violet" | "emerald" | "amber" | "blue";
}

const accentStyles = {
  violet: "border-violet-100 bg-violet-50/40",
  emerald: "border-emerald-100 bg-emerald-50/40",
  amber: "border-amber-100 bg-amber-50/40",
  blue: "border-blue-100 bg-blue-50/40",
} as const;

export function ResponseCard({
  title,
  children,
  accent = "blue",
}: ResponseCardProps) {
  return (
    <article
      className={`rounded-xl border p-3.5 ${accentStyles[accent]}`}
    >
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-800">{children}</div>
    </article>
  );
}
