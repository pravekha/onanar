import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2 } from "lucide-react";
import api from "../lib/api";
import { deadlineBadge, TRACK_STATUSES, STATUS_LABELS } from "../lib/constants";
import { toast } from "sonner";

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
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-2">My Tracker</h1>
      <p className="text-sm text-[#7A7A7A] mb-8">{saves.length} saved opportunit{saves.length === 1 ? "y" : "ies"} — move each one along your application pipeline.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <button data-testid="tracker-filter-all" onClick={() => setFilter("")}
          className={`text-sm px-3 py-1.5 rounded-sm border transition-colors ${!filter ? "bg-[#1F1F1F] text-white border-[#1F1F1F]" : "border-[#D8CFC2] bg-white hover:border-[#1F1F1F]"}`}>
          All ({saves.length})
        </button>
        {TRACK_STATUSES.map((s) => (
          <button key={s} data-testid={`tracker-filter-${s}`} onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-sm border transition-colors ${filter === s ? "bg-[#D94A2B] text-white border-[#D94A2B]" : "border-[#D8CFC2] bg-white hover:border-[#1F1F1F]"}`}>
            {STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#7A7A7A] py-16">Loading…</p>
      ) : shown.length === 0 ? (
        <div data-testid="tracker-empty" className="text-center py-16 border border-dashed border-[#D8CFC2] rounded-sm">
          <p className="text-sm text-[#7A7A7A] mb-3">Nothing here yet.</p>
          <Link to="/opportunities" className="text-sm text-[#D94A2B] hover:underline">Browse opportunities →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((s) => {
            const o = s.opportunity;
            const badge = deadlineBadge(o);
            return (
              <div key={s.id} data-testid={`tracker-item-${s.id}`} className="bg-white border border-[#D8CFC2] rounded-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/opportunities/${o.id}`} className="font-display text-xl font-semibold hover:text-[#D94A2B] transition-colors">{o.title}</Link>
                    <p className="text-sm text-[#7A7A7A]">{o.organisation} · Deadline {o.deadline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-sm ${badge.cls}`}>{badge.label}</span>
                      <a href={o.source_url} target="_blank" rel="noopener noreferrer" data-testid={`tracker-source-${s.id}`}
                        className="text-xs text-[#D94A2B] inline-flex items-center gap-1 hover:underline">Source <ExternalLink size={11} /></a>
                    </div>
                    {o.required_documents?.length > 0 && (
                      <p className="mt-2 text-xs text-[#7A7A7A]">Documents: {o.required_documents.join(" · ")}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select data-testid={`tracker-status-select-${s.id}`} value={s.status} onChange={(e) => updateStatus(s, e.target.value)}
                      className="border border-[#D8CFC2] bg-white rounded-sm px-3 py-1.5 text-sm focus:border-[#1F1F1F]">
                      {TRACK_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                    </select>
                    <button data-testid={`tracker-remove-${s.id}`} onClick={() => remove(s)} className="text-[#7A7A7A] hover:text-[#D94A2B] transition-colors" title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <textarea data-testid={`tracker-notes-${s.id}`} defaultValue={s.notes} rows={1}
                    placeholder="Notes — portfolio to update, references to ask…"
                    onBlur={(e) => e.target.value !== s.notes && saveNotes(s, e.target.value)}
                    className="flex-1 border border-[#D8CFC2] bg-[#F7F2EA]/50 rounded-sm px-3 py-2 text-sm focus:border-[#1F1F1F] resize-y" />
                </div>
                <p className="mt-2 text-xs text-[#7A7A7A]">Last updated {new Date(s.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
