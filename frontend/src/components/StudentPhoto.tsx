interface Props {
  url?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  square?: boolean;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-10 w-10 text-xs",
  sm: "h-14 w-14 text-sm",
  md: "h-20 w-20 text-base",
  lg: "h-32 w-32 text-2xl",
  xl: "h-48 w-48 text-3xl",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function StudentPhoto({ url, name, size = "md", square = false }: Props) {
  const cls = `${SIZES[size]} ${
    square ? "rounded-sm" : "rounded-full"
  } overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0`;
  if (url) {
    return (
      <div className={cls}>
        <img src={url} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${cls} bg-gradient-to-br from-titanes-dark to-titanes-navy text-white display`}>
      {initials(name)}
    </div>
  );
}
