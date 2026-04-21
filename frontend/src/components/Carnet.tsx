import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDateEs, MONTH_NAMES_ES } from "../utils";

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

function SoccerBall({ size = 150 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="sb-grad" cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d8dde3" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#sb-grad)" stroke="#1a1a1a" strokeWidth="1.5" />
      <polygon
        points="50,33 63,42 58,58 42,58 37,42"
        fill="#0f1216"
        stroke="#0f1216"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M50,33 L50,15 M63,42 L79,36 M58,58 L70,72 M42,58 L30,72 M37,42 L21,36"
        stroke="#0f1216"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#0f1216" strokeWidth="2" />
    </svg>
  );
}

function VolleyBall({ size = 150 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="vb-grad" cx="40%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dfe5ec" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#vb-grad)" stroke={NAVY_DEEP} strokeWidth="1.5" />
      <path d="M50,4 C35,25 35,55 50,96" stroke={NAVY_DEEP} strokeWidth="2" fill="none" />
      <path d="M50,4 C65,25 65,55 50,96" stroke={NAVY_DEEP} strokeWidth="2" fill="none" />
      <path d="M4,50 C25,35 75,35 96,50" stroke={NAVY_DEEP} strokeWidth="2" fill="none" />
      <path d="M4,50 C25,65 75,65 96,50" stroke={NAVY_DEEP} strokeWidth="2" fill="none" />
      <path d="M14,22 C40,40 60,40 86,22" stroke={NAVY_DEEP} strokeWidth="1.5" fill="none" />
      <path d="M14,78 C40,60 60,60 86,78" stroke={NAVY_DEEP} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function WaterDrop({ size = 150 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="wd-grad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#cfe7ff" />
          <stop offset="70%" stopColor="#3b82c4" />
          <stop offset="100%" stopColor="#0b3b6e" />
        </radialGradient>
      </defs>
      <path
        d="M50,6 C50,6 16,46 16,66 a34,34 0 0 0 68,0 C84,46 50,6 50,6 Z"
        fill="url(#wd-grad)"
        stroke={NAVY_DEEP}
        strokeWidth="1.5"
      />
      <path
        d="M30,62 a20,14 0 0 0 12,14"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SportBall({ sport, size }: { sport: string | null; size?: number }) {
  const s = (sport || "").toUpperCase();
  if (s.includes("FÚTBOL") || s.includes("FUTBOL")) return <SoccerBall size={size} />;
  if (s.includes("VOLEIBOL") || s.includes("VOLLEY")) return <VolleyBall size={size} />;
  if (s.includes("NATACIÓN") || s.includes("NATACION")) return <WaterDrop size={size} />;
  return null;
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

  const joinDate = new Date(student.join_date);
  const joinYear = joinDate.getFullYear();
  const joinLabel = `${MONTH_NAMES_ES[joinDate.getMonth()] ?? ""} de ${joinYear}`;

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
            "linear-gradient(180deg, #f4f7fc 0%, #e6edf8 55%, #dbe5f4 100%)",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 340 540"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-20,120 C90,70 210,180 360,110 L360,220 C230,280 110,180 -20,240 Z"
          fill="#cedbf0"
          opacity="0.55"
        />
        <path
          d="M-20,180 C100,130 220,240 360,170"
          stroke="#a8bde0"
          strokeWidth="1.2"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M-20,250 C90,210 230,320 360,260"
          stroke="#c0d0ea"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M-20,320 C110,270 230,380 360,310"
          stroke="#d3dfee"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M-20,390 C100,350 230,460 360,380"
          stroke="#c8d6ea"
          strokeWidth="1"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M-20,450 C120,410 220,510 360,440 L360,540 L-20,540 Z"
          fill="#d9e3f3"
          opacity="0.6"
        />
        <path
          d="M-20,480 C110,440 240,540 360,470"
          stroke="#b7c9e6"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>

      {student.sport ? (
        <div className="absolute right-[-18px] bottom-[48px] pointer-events-none select-none drop-shadow-lg">
          <SportBall sport={student.sport} size={150} />
        </div>
      ) : null}

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
