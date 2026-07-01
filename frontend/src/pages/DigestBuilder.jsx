import { useState } from "react";
import { Copy, Check } from "lucide-react";
import api from "../lib/api";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES } from "../lib/constants";
import { toast } from "sonner";

const input = "bg-white rounded-full px-4 py-2.5 text-sm border border-lilac/40 focus:border-ink focus:outline-none text-ink";
const label = "text-[10px] uppercase tracking-[0.25em] text-ink/60 font-semibold block mb-1.5 ml-4";
const FORMATS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
];

export default function DigestBuilder() {
  const [filters, setFilters] = useState({ discipline: "", opportunity_type: "", location: "", deadline_window: 30, career_stage: "", limit: 8 });
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("whatsapp");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await api.post("/admin/digest", { ...filters, deadline_window: Number(filters.deadline_window), limit: Number(filters.limit) });
      setResult(r.data);
      if (r.data.opportunities.length === 0) toast("No open opportunities match these filters");
      else toast.success(`Digest generated with ${r.data.opportunities.length} opportunities`);
    } finally {
      setBusy(false);
    }
  };

  const copy = (key) => {
    navigator.clipboard.writeText(result.formats[key]);
    setCopied(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(""), 2000);
  };

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      {/* Header bento */}
      <div className="grid grid-cols-12 gap-4 md:gap-5 mb-6">
        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-8 bento">
          <p className="section-num mb-3">02 / Digest</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink">
            This week&apos;s <span className="marker-lilac">picks</span>.
          </h1>
          <p className="mt-4 text-sm text-ink/70">Generate copy for WhatsApp, email, Instagram and LinkedIn.</p>
        </div>
        <div className="col-span-12 md:col-span-4 bg-butter rounded-3xl p-8 bento flex flex-col justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-ink/70 font-semibold">Selected</p>
          <p className="font-display text-6xl text-ink leading-none">{result?.opportunities.length || "—"}</p>
          <p className="text-xs text-ink/70">Opportunities in this digest</p>
        </div>
      </div>

      {/* Filter tile */}
      <div className="bg-white rounded-3xl p-6 md:p-8 mb-6 bento">
        <p className="section-num mb-5">Filters</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={label}>Discipline</label>
            <select data-testid="digest-discipline" value={filters.discipline} onChange={set("discipline")} className={input}>
              <option value="">All</option>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Type</label>
            <select data-testid="digest-type" value={filters.opportunity_type} onChange={set("opportunity_type")} className={input}>
              <option value="">All</option>{OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Location</label>
            <input data-testid="digest-location" value={filters.location} onChange={set("location")} className={`${input} w-32`} placeholder="Any" />
          </div>
          <div>
            <label className={label}>Window (days)</label>
            <input data-testid="digest-window" type="number" min="1" value={filters.deadline_window} onChange={set("deadline_window")} className={`${input} w-24`} />
          </div>
          <div>
            <label className={label}>Career stage</label>
            <select data-testid="digest-career-stage" value={filters.career_stage} onChange={set("career_stage")} className={input}>
              <option value="">All</option>{CAREER_STAGES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Count</label>
            <input data-testid="digest-limit" type="number" min="5" max="10" value={filters.limit} onChange={set("limit")} className={`${input} w-20`} />
          </div>
          <button data-testid="digest-generate-button" onClick={generate} disabled={busy}
            className="bg-flame text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-ink hover:text-butter transition-all disabled:opacity-60">
            {busy ? "Generating…" : "Generate digest"}
          </button>
        </div>
      </div>

      {result && result.opportunities.length > 0 && (
        <>
          <div className="bg-ink text-butter rounded-3xl p-8 md:p-10 mb-6 bento">
            <p className="section-num mb-3" style={{ color: "#F94500" }}>Preview</p>
            <h2 className="font-display text-3xl md:text-4xl text-butter mb-6 leading-tight">This Week&apos;s Creative Opportunities</h2>
            <ol className="space-y-4">
              {result.opportunities.map((o, i) => (
                <li key={o.id} className="flex gap-4 text-sm border-b border-white/10 pb-4 last:border-0">
                  <span className="font-display text-3xl text-flame leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{o.title} — {o.organisation}</p>
                    <p className="text-lilac mt-1">{o.summary}</p>
                    <p className="text-xs mt-2 text-lilac">
                      Deadline {o.deadline || o.deadline_note || "recurring"}{o.days_left != null ? ` (${o.days_left} days)` : ""} · {o.funding_amount} · <a href={o.source_url} className="text-flame hover:text-butter" target="_blank" rel="noopener noreferrer">Source</a>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            {FORMATS.map((fm) => (
              <button key={fm.key} data-testid={`digest-tab-${fm.key}`} onClick={() => setTab(fm.key)}
                className={`text-sm font-medium px-5 py-2 rounded-full transition-all ${tab === fm.key ? "bg-ink text-butter" : "bg-white text-ink hover:bg-lilac/40"}`}>
                {fm.label}
              </button>
            ))}
          </div>
          <div className="relative bg-white rounded-3xl p-2 bento">
            <textarea data-testid="digest-output" readOnly value={result.formats[tab]} rows={14}
              className="w-full bg-transparent p-4 text-sm font-mono text-ink focus:outline-none resize-y" />
            <button data-testid="digest-copy-button" onClick={() => copy(tab)}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 bg-flame text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-ink hover:text-butter transition-all">
              {copied === tab ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
