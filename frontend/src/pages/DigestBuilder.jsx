import { useState } from "react";
import { Copy, Check } from "lucide-react";
import api from "../lib/api";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES } from "../lib/constants";
import { toast } from "sonner";

const input = "border border-[#D8CFC2] bg-white rounded-sm px-3 py-2 text-sm focus:border-[#1F1F1F]";
const FORMATS = [
  { key: "whatsapp", label: "WhatsApp digest" },
  { key: "email", label: "Email digest" },
  { key: "instagram", label: "Instagram caption" },
  { key: "linkedin", label: "LinkedIn post" },
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
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-2">Digest Builder</h1>
      <p className="text-sm text-[#7A7A7A] mb-8">Generate "This Week's Creative Opportunities" for WhatsApp, email and social.</p>

      <div className="bg-white border border-[#D8CFC2] rounded-sm p-5 mb-8">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1">Discipline</label>
            <select data-testid="digest-discipline" value={filters.discipline} onChange={set("discipline")} className={input}>
              <option value="">All</option>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1">Type</label>
            <select data-testid="digest-type" value={filters.opportunity_type} onChange={set("opportunity_type")} className={input}>
              <option value="">All</option>{OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1">Location</label>
            <input data-testid="digest-location" value={filters.location} onChange={set("location")} className={`${input} w-32`} placeholder="Any" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1">Deadline window (days)</label>
            <input data-testid="digest-window" type="number" min="1" value={filters.deadline_window} onChange={set("deadline_window")} className={`${input} w-24`} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1">Career stage</label>
            <select data-testid="digest-career-stage" value={filters.career_stage} onChange={set("career_stage")} className={input}>
              <option value="">All</option>{CAREER_STAGES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1">Count (5–10)</label>
            <input data-testid="digest-limit" type="number" min="5" max="10" value={filters.limit} onChange={set("limit")} className={`${input} w-20`} />
          </div>
          <button data-testid="digest-generate-button" onClick={generate} disabled={busy}
            className="bg-[#D94A2B] text-white px-6 py-2 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors disabled:opacity-60">
            {busy ? "Generating…" : "Generate digest"}
          </button>
        </div>
      </div>

      {result && result.opportunities.length > 0 && (
        <>
          <div className="bg-white border border-[#D8CFC2] rounded-sm p-6 mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">This Week's Creative Opportunities</h2>
            <ol className="space-y-3">
              {result.opportunities.map((o, i) => (
                <li key={o.id} className="flex gap-3 text-sm border-b border-[#D8CFC2]/60 pb-3 last:border-0">
                  <span className="font-display text-lg text-[#D94A2B] font-semibold">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-medium">{o.title} — {o.organisation}</p>
                    <p className="text-[#7A7A7A]">{o.summary}</p>
                    <p className="text-xs mt-1">Deadline {o.deadline} ({o.days_left} days) · {o.funding_amount} · <a href={o.source_url} className="text-[#D94A2B] hover:underline" target="_blank" rel="noopener noreferrer">Source</a></p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            {FORMATS.map((fm) => (
              <button key={fm.key} data-testid={`digest-tab-${fm.key}`} onClick={() => setTab(fm.key)}
                className={`text-sm px-4 py-2 rounded-sm border transition-colors ${tab === fm.key ? "bg-[#1F1F1F] text-white border-[#1F1F1F]" : "border-[#D8CFC2] bg-white hover:border-[#1F1F1F]"}`}>
                {fm.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea data-testid="digest-output" readOnly value={result.formats[tab]} rows={14}
              className="w-full border border-[#D8CFC2] bg-white rounded-sm p-4 text-sm font-mono focus:border-[#1F1F1F]" />
            <button data-testid="digest-copy-button" onClick={() => copy(tab)}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-[#D94A2B] text-white px-3 py-1.5 rounded-sm text-xs font-medium hover:bg-[#B83D21] transition-colors">
              {copied === tab ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
