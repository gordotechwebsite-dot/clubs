import { QRCodeSVG } from "qrcode.react";
import type { Student } from "../types";
import { formatDateEs } from "../utils";

interface Props {
  student: Student;
}

function yearFromIso(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).getFullYear().toString();
  } catch {
    return "—";
  }
}

export default function Carnet({ student }: Props) {
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const qrValue = JSON.stringify({
    club: "Club Titanes Soatá",
    id: student.id,
    name: student.full_name,
    doc: student.document_id,
    valid_until: validUntil.toISOString().slice(0, 10),
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        id={`carnet-${student.id}`}
        className="relative w-[340px] h-[540px] rounded-2xl overflow-hidden shadow-2xl text-white"
        style={{
          background:
            "linear-gradient(160deg, #0b1b4a 0%, #132a7a 45%, #7a0f14 75%, #d32f2f 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#ffffff55,_transparent_60%)]" />
        <div className="relative p-5 flex flex-col items-center h-full">
          <div className="flex items-center justify-between w-full">
            <img src="/logo.png" alt="Titanes" className="h-14 w-14 object-contain drop-shadow" />
            <div className="text-right leading-tight">
              <div className="font-display tracking-widest text-sm opacity-80">CLUB</div>
              <div className="font-display text-2xl tracking-wide">TITANES</div>
              <div className="text-[10px] uppercase opacity-80">Soatá</div>
            </div>
          </div>

          <div className="mt-4 h-36 w-36 rounded-full overflow-hidden ring-4 ring-white/70 bg-white/10 flex items-center justify-center">
            {student.photo_url ? (
              <img src={student.photo_url} className="h-full w-full object-cover" alt="" />
            ) : (
              <span className="text-white/60 text-xs">Sin foto</span>
            )}
          </div>

          <div className="mt-4 text-center">
            <div className="font-display text-xl leading-tight uppercase">{student.full_name}</div>
            <div className="text-xs opacity-80 mt-1">
              {[student.sport, student.category].filter(Boolean).join(" · ") || "Deportista"}
            </div>
          </div>

          <div className="mt-4 w-full grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="opacity-70 uppercase tracking-wide text-[9px]">ID</div>
              <div className="font-semibold">{student.id.toString().padStart(4, "0")}</div>
            </div>
            <div className="text-right">
              <div className="opacity-70 uppercase tracking-wide text-[9px]">Documento</div>
              <div className="font-semibold">{student.document_id || "—"}</div>
            </div>
            <div>
              <div className="opacity-70 uppercase tracking-wide text-[9px]">Nacido</div>
              <div className="font-semibold">{yearFromIso(student.birth_date)}</div>
            </div>
            <div className="text-right">
              <div className="opacity-70 uppercase tracking-wide text-[9px]">Ingreso</div>
              <div className="font-semibold">{formatDateEs(student.join_date)}</div>
            </div>
          </div>

          <div className="mt-auto w-full flex items-end justify-between">
            <div className="text-[10px] opacity-80 uppercase tracking-wide">
              Válido hasta
              <div className="font-semibold text-white text-xs">
                {formatDateEs(validUntil.toISOString())}
              </div>
            </div>
            <div className="bg-white p-2 rounded-md">
              <QRCodeSVG value={qrValue} size={64} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
