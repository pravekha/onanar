import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { deadlineBadge, TRACK_STATUSES, STATUS_LABELS } from "../lib/constants";
import { toast } from "sonner";

// Vary card background per index for bento variety
const TILE_BG = ["bg-white", "bg-butter", "bg-white", "bg-lilac", "bg-white", "bg-butter"];

export default function TrackerPage() {
  const [saves, setSaves] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/saves").then((r) => setSaves(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (save, status) => {
    const r = await api.patch(`/saves/${save.id}`, { status });
    setSaves((prev) => prev.map((s) => (s.id === save.id ? { ...s, ...r.data } : s)));
    toast.success(`Moved to ${STATUS_LABELS[status]}`);
  };

  const saveNotes = async (save, notes) => {
    await api.patch(`/saves/${save.id}`, { notes });
    toast.success("Notes saved");
  };

  const remove = async (save) => {
    await api.delete(`/saves/${save.opportunity_id}`);
    setSaves((prev) => prev.filter((s) => s.id !== save.id));
    toast("Removed from tracker");
  };

  const counts = TRACK_STATUSES.reduce((acc, s) => ({ ...acc, [s]: saves.filter((x) => x.status === s).length }), {});
  const shown = filter ? saves.filter((s) => s.status === filter) : saves;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      {/* Header bento */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-8 bento">
          <p className="section-num mb-3">02 / Tracker</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink">
            My <span className="marker-lilac">application</span> tracker.
          </h1>
          <p className="mt-4 text-sm text-ink/70">{saves.length} saved opportunit{saves.length === 1 ? "y" : "ies"} — move each one along your pipeline.</p>
        </div>
        <div className="col-span-6 md:col-span-2 bg-flame rounded-3xl p-6 bento flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink/80 font-semibold">Applied</span>
          <p className="font-display text-5xl text-ink leading-none">{counts.applied || 0}</p>
        </div>
        <div className="col-span-6 md:col-span-2 bg-butter rounded-3xl p-6 bento flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.25em] text-ink/70 font-semibold">Accepted</span>
          <p className="font-display text-5xl text-ink leading-none">{counts.accepted || 0}</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button data-testid="tracker-filter-all" onClick={() => setFilter("")}
          className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${!filter ? "bg-ink text-butter" : "bg-white text-ink hover:bg-lilac/40"}`}>
          All · {saves.length}
        </button>
        {TRACK_STATUSES.map((s) => (
          <button key={s} data-testid={`tracker-filter-${s}`} onClick={() => setFilter(s)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${filter === s ? "bg-flame text-white" : "bg-white text-ink hover:bg-lilac/40"}`}>
            {STATUS_LABELS[s]} · {counts[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-sm text-ink/60 py-16">Loading…</p>
      ) : shown.length === 0 ? (
        <div data-testid="tracker-empty" className="text-center py-20 bg-white rounded-3xl bento">
          <p className="font-display text-3xl text-ink mb-3">Nothing here yet.</p>
          <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm text-flame font-semibold hover:gap-3 transition-all">
            Browse opportunities <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((s, i) => {
            const o = s.opportunity;
            const badge = deadlineBadge(o);
            const bg = TILE_BG[i % TILE_BG.length];
            return (
              <div key={s.id} data-testid={`tracker-item-${s.id}`} className={`${bg} rounded-3xl p-6 bento bento-hover`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/opportunities/${o.id}`} className="font-display text-2xl text-ink hover:text-flame transition-colors leading-tight">{o.title}</Link>
                    <p className="text-sm text-ink/60 mt-1">{o.organisation} · Deadline {o.deadline || o.deadline_note || "recurring"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                      <a href={o.source_url} target="_blank" rel="noopener noreferrer" data-testid={`tracker-source-${s.id}`}
                        className="text-xs text-flame font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                        Source <ExternalLink size={11} />
                      </a>
                    </div>
                    {o.required_documents?.length > 0 && (
                      <p className="mt-2 text-xs text-ink/60">Docs: {o.required_documents.join(" · ")}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select data-testid={`tracker-status-select-${s.id}`} value={s.status} onChange={(e) => updateStatus(s, e.target.value)}
                      className="bg-ink text-butter rounded-full px-4 py-2 text-sm font-medium focus:outline-none cursor-pointer">
                      {TRACK_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                    </select>
                    <button data-testid={`tracker-remove-${s.id}`} onClick={() => remove(s)} className="text-ink/60 hover:text-flame transition-colors" title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <textarea data-testid={`tracker-notes-${s.id}`} defaultValue={s.notes} rows={1}
                  placeholder="Notes — portfolio to update, references to ask…"
                  onBlur={(e) => e.target.value !== s.notes && saveNotes(s, e.target.value)}
                  className="mt-4 w-full bg-white/70 rounded-2xl px-4 py-2.5 text-sm border border-ink/10 focus:border-ink focus:outline-none resize-y" />
                <p className="mt-2 text-xs text-ink/50">Updated {new Date(s.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
