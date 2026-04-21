import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 pb-6 mb-6 border-b border-slate-200">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-titanes-red mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="h-page">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-2 text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
