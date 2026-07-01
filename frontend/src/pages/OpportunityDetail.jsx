import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ExternalLink, Bookmark, BookmarkCheck, BadgeCheck, MapPin, CalendarDays, Wallet, FileText, AlertTriangle } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { deadlineBadge, STATUS_LABELS, TRACK_STATUSES } from "../lib/constants";
import OpportunityCard from "../components/OpportunityCard";
import { toast } from "sonner";

export default function OpportunityDetail() {
  const { id } = useParams();
  const [opp, setOpp] = useState(null);
  const [save, setSave] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(() => {
    api.get(`/opportunities/${id}`).then((r) => setOpp(r.data));
    if (user && user.role !== "admin") {
      api.get("/saves").then((r) => setSave(r.data.find((s) => s.opportunity_id === id) || null));
    }
  }, [id, user]);

  useEffect(() => { load(); window.scrollTo(0, 0); }, [load]);

  if (!opp) return <p className="text-center text-sm text-[#7A7A7A] py-20">Loading…</p>;
  const badge = deadlineBadge(opp);

  const toggleSave = async () => {
    if (!user) { navigate("/login"); return; }
    if (save) {
      await api.delete(`/saves/${id}`);
      setSave(null);
      toast("Removed from tracker");
    } else {
      const r = await api.post("/saves", { opportunity_id: id });
      setSave(r.data);
      toast.success("Saved to your tracker");
    }
  };

  const setStatus = async (status) => {
    let s = save;
    if (!s) {
      const r = await api.post("/saves", { opportunity_id: id });
      s = r.data;
    }
    const r = await api.patch(`/saves/${s.id}`, { status });
    setSave(r.data);
    toast.success(`Marked as ${STATUS_LABELS[status]}`);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      <Link to="/opportunities" className="text-sm text-[#7A7A7A] hover:text-[#D94A2B]">← Back to directory</Link>

      <div className="mt-4 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs uppercase tracking-widest text-[#D94A2B] font-medium">{opp.opportunity_type}</span>
            {opp.verified ? (
              <span data-testid="detail-verified-badge" className="inline-flex items-center gap-1 text-xs text-[#4F6F52]"><BadgeCheck size={14} /> Verified listing</span>
            ) : (
              <span className="text-xs text-[#7A7A7A]">Unverified — check the source</span>
            )}
            <span data-testid="detail-deadline-badge" className={`text-xs px-2.5 py-1 rounded-sm ${badge.cls}`}>{badge.label}</span>
          </div>
          <h1 data-testid="detail-title" className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">{opp.title}</h1>
          <p className="text-base text-[#7A7A7A] mt-2">{opp.organisation} · {opp.source_type}</p>

          {opp.match_summary && (
            <div data-testid="detail-match" className="mt-5 bg-white border border-[#D8CFC2] rounded-sm p-4">
              <p className="text-sm font-medium text-[#D94A2B]">{opp.match_summary}</p>
              {opp.match_cautions?.length > 0 && (
                <p className="mt-2 text-xs text-[#1F1F1F]/70 inline-flex items-start gap-1.5">
                  <AlertTriangle size={13} className="text-[#D94A2B] mt-0.5 shrink-0" /> {opp.match_cautions.join(" ")}
                </p>
              )}
            </div>
          )}

          <section className="mt-8 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold mb-2">About</h2>
              <p className="text-base leading-relaxed text-[#1F1F1F]/85">{opp.summary}</p>
              <p className="mt-3 text-base leading-relaxed text-[#1F1F1F]/85">{opp.description}</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold mb-2">Eligibility</h2>
              <p className="text-base leading-relaxed text-[#1F1F1F]/85">{opp.eligibility}</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold mb-2">Required documents</h2>
              <ul className="list-disc list-inside text-base text-[#1F1F1F]/85 space-y-1">
                {(opp.required_documents || []).map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(opp.tags || []).map((t) => <span key={t} className="text-xs border border-[#D8CFC2] bg-white px-2 py-0.5 rounded-sm text-[#1F1F1F]/70">#{t}</span>)}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-[#D8CFC2] rounded-sm p-5 space-y-3 text-sm">
            <p className="flex items-center gap-2"><CalendarDays size={15} className="text-[#D94A2B]" /> Deadline: <strong>{opp.deadline || "Recurring"}</strong></p>
            {opp.deadline_note && <p className="text-xs text-[#7A7A7A] pl-6 -mt-2">{opp.deadline_note}</p>}
            <p className="flex items-center gap-2"><Wallet size={15} className="text-[#D94A2B]" /> {opp.funding_amount}</p>
            <p className="flex items-center gap-2"><MapPin size={15} className="text-[#D94A2B]" /> {opp.location}{opp.online_available ? " · Online available" : ""}</p>
            <p className="flex items-center gap-2"><FileText size={15} className="text-[#D94A2B]" /> Fee: {opp.application_fee || "None"}</p>
            <p className="text-[#7A7A7A]">Career stage: {opp.career_stage} · Difficulty: {opp.difficulty}</p>
            <div className="pt-3 border-t border-[#D8CFC2] space-y-2">
              <a data-testid="source-link" href={opp.source_url} target="_blank" rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#D94A2B] text-white px-4 py-2.5 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors">
                Open source link <ExternalLink size={14} />
              </a>
              <button data-testid="detail-save-button" onClick={toggleSave}
                className="w-full inline-flex items-center justify-center gap-2 border border-[#1F1F1F] px-4 py-2.5 rounded-sm text-sm font-medium hover:bg-[#1F1F1F] hover:text-white transition-colors">
                {save ? <><BookmarkCheck size={15} /> Saved</> : <><Bookmark size={15} /> Save opportunity</>}
              </button>
            </div>
          </div>

          {user && user.role !== "admin" && (
            <div className="bg-white border border-[#D8CFC2] rounded-sm p-5">
              <p className="text-xs uppercase tracking-widest text-[#7A7A7A] mb-3">Track your application</p>
              <div className="grid grid-cols-2 gap-2">
                {TRACK_STATUSES.map((s) => (
                  <button key={s} data-testid={`status-button-${s}`} onClick={() => setStatus(s)}
                    className={`text-xs px-2 py-2 rounded-sm border transition-colors ${save?.status === s ? "bg-[#D94A2B] text-white border-[#D94A2B]" : "border-[#D8CFC2] hover:border-[#1F1F1F]"}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {save && <p className="mt-3 text-xs text-[#4F6F52]">Current status: {STATUS_LABELS[save.status]}</p>}
            </div>
          )}
        </aside>
      </div>

      {opp.similar?.length > 0 && (
        <section className="mt-14 border-t border-[#D8CFC2] pt-10">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Similar opportunities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {opp.similar.map((s) => <OpportunityCard key={s.id} opp={s} />)}
          </div>
        </section>
      )}
    </main>
  );
}
