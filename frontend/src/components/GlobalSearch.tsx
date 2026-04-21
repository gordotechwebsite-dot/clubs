import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentsApi } from "../api";
import type { SearchStudent } from "../types";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchStudent[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      studentsApi
        .search(term)
        .then((r) => {
          if (!cancelled) {
            setResults(r.data);
            setOpen(true);
            setHighlight(0);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goTo(s: SearchStudent) {
    setOpen(false);
    setQuery("");
    navigate(`/estudiantes/${s.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        navigate(`/estudiantes?search=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full md:w-72">
      <input
        className="input w-full text-sm"
        placeholder="Buscar deportista, documento o teléfono"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs uppercase tracking-widest text-slate-500">
              Buscando
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">
              Sin resultados.
            </div>
          )}
          {results.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`w-full text-left px-3 py-2 flex flex-col ${
                idx === highlight ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => goTo(s)}
            >
              <span className="font-semibold text-slate-900 text-sm">
                {s.full_name}
                {!s.is_active && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Archivado
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">
                {[s.document_id, s.phone, s.sport, s.category]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
