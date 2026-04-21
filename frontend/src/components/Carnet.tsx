import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDateEs } from "../utils";

export interface CarnetData {
  id: number;
  full_name: string;
  photo_url: string | null;
  sport: string | null;
  category: string | null;
  join_date: string;
  document_id?: string | null;
  birth_date?: string | null;
  phone?: string | null;
}

interface Props {
  student: CarnetData;
  publicUrl?: string;
}

const NAVY = "#0b1b4a";
const NAVY_DEEP = "#05102f";
const RED = "#b71c1c";

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconCake() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M20 21V11a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10" />
      <path d="M4 15h16" />
      <path d="M12 9V5" />
      <path d="M12 2v2" />
      <path d="M3 21h18" />
    </svg>
  );
}
function IconRun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <circle cx="13" cy="4" r="2" />
      <path d="M4 22l4-8 3 3 3-5 5 3" />
      <path d="M9 9l3-3 4 4 3-1" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M5 4H3v2a3 3 0 0 0 3 3" />
      <path d="M19 4h2v2a3 3 0 0 1-3 3" />
      <path d="M10 18h4" />
      <path d="M12 14v4" />
      <path d="M8 21h8" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72a2 2 0 0 1 1.72 2z" />
    </svg>
  );
}
function IconHash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="h-5 w-5 shrink-0 mt-0.5" style={{ color: NAVY }}>
        {icon}
      </div>
      <div className="leading-tight min-w-0">
        <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-500">
          {label}
        </div>
        <div className="text-[11px] font-bold uppercase text-slate-900 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

const BASE_W = 340;
const BASE_H = 540;

export default function Carnet({ student, publicUrl }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / BASE_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const qrValue =
    publicUrl ||
    JSON.stringify({
      club: "Club Titanes Soatá",
      id: student.id,
      name: student.full_name,
    });

  const initials = student.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const joinYear = new Date(student.join_date).getFullYear();
  const joinLabel = formatDateEs(student.join_date);

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [];
  rows.push({
    icon: <IconHash />,
    label: "ID",
    value: student.id.toString().padStart(6, "0"),
  });
  if (student.document_id) {
    rows.push({
      icon: <IconCalendar />,
      label: "Documento",
      value: student.document_id,
    });
  }
  if (student.birth_date) {
    rows.push({
      icon: <IconCake />,
      label: "Nacimiento",
      value: formatDateEs(student.birth_date),
    });
  }
  if (student.sport) {
    rows.push({
      icon: <IconRun />,
      label: "Deporte",
      value: student.sport,
    });
  }
  if (student.category) {
    rows.push({
      icon: <IconTrophy />,
      label: "Categoría",
      value: student.category,
    });
  }
  if (student.phone) {
    rows.push({
      icon: <IconPhone />,
      label: "Teléfono",
      value: student.phone,
    });
  }
  const visibleRows = rows.slice(0, 5);

  return (
    <div
      ref={wrapRef}
      className="w-full carnet-fit-wrap"
      style={{ maxWidth: BASE_W, height: BASE_H * scale }}
    >
    <div
      id={`carnet-${student.id}`}
      className="relative overflow-hidden bg-white shadow-2xl rounded-md carnet-fit"
      style={{
        width: BASE_W,
        height: BASE_H,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 15% 25%, rgba(19,42,122,0.08), transparent 45%), radial-gradient(circle at 85% 75%, rgba(183,28,28,0.06), transparent 45%)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
        viewBox="0 0 340 540"
        preserveAspectRatio="none"
      >
        <path
          d="M0,460 C80,440 160,500 340,470 L340,540 L0,540 Z"
          fill="#eaf0fb"
        />
        <path
          d="M0,420 C110,400 190,470 340,430"
          stroke="#d4deee"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      <div
        className="absolute top-0 left-0 right-0 h-9"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}
      />
      <div className="absolute top-9 left-0 right-0 h-[3px]" style={{ background: RED }} />

      <div className="absolute top-14 left-0 right-0 flex justify-center">
        <img
          src="/logo.png"
          alt="Club Titanes"
          className="h-[170px] w-[170px] object-contain drop-shadow"
        />
      </div>

      <div className="absolute top-[222px] left-0 right-0 text-center">
        <div
          style={{ fontFamily: "Oswald, sans-serif", color: NAVY }}
          className="text-[11px] font-bold uppercase tracking-[0.35em]"
        >
          Carnet oficial {joinYear}
        </div>
      </div>

      <div className="absolute left-5 top-[258px] w-[130px] h-[165px]">
        <div
          className="w-full h-full rounded-md overflow-hidden shadow-lg ring-2 ring-white"
          style={{ background: NAVY }}
        >
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white"
              style={{ fontFamily: "Oswald, sans-serif", fontSize: 38 }}
            >
              {initials}
            </div>
          )}
        </div>
        <div
          className="absolute -bottom-2 left-[-4px] right-[-8px] px-2.5 py-1.5 text-white uppercase shadow"
          style={{
            background: RED,
            fontFamily: "Oswald, sans-serif",
            clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
          }}
        >
          <div className="text-[13px] font-bold leading-tight tracking-wide">
            {student.full_name}
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-[258px] bg-white rounded-md p-1.5 shadow-md border border-slate-200">
        <QRCodeSVG value={qrValue} size={72} />
      </div>

      <div className="absolute right-4 top-[348px] w-[160px] space-y-2">
        {visibleRows.map((r) => (
          <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} />
        ))}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-9 flex items-center justify-center text-white"
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.25em]">
          Miembro desde {joinLabel}
        </div>
      </div>
    </div>
    </div>
  );
}
