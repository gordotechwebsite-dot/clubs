import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 md:gap-4 pb-4 md:pb-6 mb-4 md:mb-6 border-b border-slate-200">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.25em] md:tracking-[0.3em] text-titanes-red mb-1.5 md:mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="h-page">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-2 text-xs md:text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">{actions}</div>}
    </div>
  );
}
