import { QRCodeSVG } from "qrcode.react";
import type { Student } from "../types";
import { formatDateEs } from "../utils";

interface Props {
  student: Student;
  validUntil?: Date;
  publicUrl?: string;
}

export default function Carnet({ student, validUntil, publicUrl }: Props) {
  const valid = validUntil || (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  })();

  const qrValue =
    publicUrl ||
    JSON.stringify({
      club: "Club Titanes Soatá",
      id: student.id,
      name: student.full_name,
      doc: student.document_id,
      sport: student.sport,
      valid_until: valid.toISOString().slice(0, 10),
    });

  return (
    <div
      id={`carnet-${student.id}`}
      className="relative w-[340px] h-[540px] overflow-hidden text-white shadow-2xl"
      style={{
        background:
          "linear-gradient(160deg, #0b1b4a 0%, #132a7a 50%, #7a0f14 80%, #b71c1c 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 55%)",
        }}
      />
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <img src="/logo.png" alt="Club Titanes" className="h-14 w-14 object-contain" />
        <div className="text-right leading-tight">
          <div className="text-[9px] font-semibold uppercase tracking-[0.4em] opacity-80">
            Club
          </div>
          <div className="display text-2xl">TITANES</div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.4em] opacity-80">
            Soatá Boyacá
          </div>
        </div>
      </div>

      <div className="absolute top-24 left-0 right-0 flex justify-center">
        <div className="h-32 w-32 rounded-full overflow-hidden ring-4 ring-white/80 bg-white/10 flex items-center justify-center">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="display text-3xl">
              {student.full_name
                .split(/\s+/)
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="absolute left-0 right-0 top-64 px-6 text-center">
        <div className="display text-xl leading-tight">{student.full_name}</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-80 mt-1">
          {[student.sport, student.category].filter(Boolean).join(" / ") || "Deportista"}
        </div>
      </div>

      <div className="absolute bottom-28 left-6 right-6 grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">ID</div>
          <div className="font-semibold">{student.id.toString().padStart(4, "0")}</div>
        </div>
        <div className="text-right">
          <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">Documento</div>
          <div className="font-semibold">{student.document_id || "Sin registrar"}</div>
        </div>
        <div>
          <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">Ingreso</div>
          <div className="font-semibold">{formatDateEs(student.join_date)}</div>
        </div>
        <div className="text-right">
          <div className="opacity-70 uppercase tracking-[0.2em] text-[9px]">Vigencia</div>
          <div className="font-semibold">{formatDateEs(valid.toISOString())}</div>
        </div>
      </div>

      <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
        <div className="text-[9px] font-semibold uppercase tracking-[0.3em] opacity-80">
          Registro oficial del club
        </div>
        <div className="bg-white p-1.5">
          <QRCodeSVG value={qrValue} size={60} />
        </div>
      </div>
    </div>
  );
}
