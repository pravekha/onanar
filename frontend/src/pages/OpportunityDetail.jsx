import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ExternalLink, Bookmark, BookmarkCheck, BadgeCheck, MapPin, CalendarDays, Wallet, FileText, AlertTriangle, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { deadlineBadge, STATUS_LABELS, TRACK_STATUSES } from "../lib/constants";
import OpportunityCard, { cardVariantAt } from "../components/OpportunityCard";
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

  if (!opp) return <p className="text-center text-sm text-ink/60 py-20">Loading…</p>;
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
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-flame mb-6 group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to directory
      </Link>

      {/* HEADER TILE */}
      <div className="bg-white rounded-3xl p-8 md:p-10 bento mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-block rounded-full bg-flame text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">{opp.opportunity_type}</span>
          <span data-testid="detail-deadline-badge" className={`text-[11px] font-medium px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
          {opp.verified ? (
            <span data-testid="detail-verified-badge" className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70 bg-lilac/40 px-3 py-1 rounded-full">
              <BadgeCheck size={12} /> Verified
            </span>
          ) : (
            <span className="text-[11px] text-ink/50 uppercase tracking-widest">Unverified</span>
          )}
        </div>
        <h1 data-testid="detail-title" className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-ink">{opp.title}</h1>
        <p className="text-base text-ink/70 mt-4">{opp.organisation} · {opp.source_type}</p>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-5">
        {/* MAIN CONTENT */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {opp.match_summary && (
            <div data-testid="detail-match" className="bg-butter rounded-3xl p-6 bento">
              <p className="text-[10px] uppercase tracking-[0.25em] text-flame font-semibold mb-2">Match analysis</p>
              <p className="font-display text-2xl text-ink leading-tight">{opp.match_summary}</p>
              {opp.match_cautions?.length > 0 && (
                <p className="mt-4 text-sm text-ink/80 inline-flex items-start gap-2">
                  <AlertTriangle size={14} className="text-flame mt-1 shrink-0" /> {opp.match_cautions.join(" ")}
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 bento">
            <p className="section-num mb-3">About</p>
            <p className="text-base leading-relaxed text-ink/85">{opp.summary}</p>
            <p className="mt-4 text-base leading-relaxed text-ink/85">{opp.description}</p>
          </div>

          <div className="bg-lilac rounded-3xl p-8 bento">
            <p className="section-num mb-3" style={{ color: "#23003F" }}>Eligibility</p>
            <p className="text-base leading-relaxed text-ink">{opp.eligibility}</p>
          </div>

          {(opp.required_documents || []).length > 0 && (
            <div className="bg-white rounded-3xl p-8 bento">
              <p className="section-num mb-4">Required documents</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {opp.required_documents.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-base text-ink/85">
                    <FileText size={15} className="text-flame mt-1 shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(opp.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opp.tags.map((t) => <span key={t} className="text-xs bg-lilac/40 text-ink px-3 py-1 rounded-full">#{t}</span>)}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-ink text-butter rounded-3xl p-6 bento space-y-3.5 text-sm">
            <p className="flex items-start gap-2.5"><CalendarDays size={16} className="text-lilac mt-0.5 shrink-0" /> <span>Deadline: <strong className="text-white">{opp.deadline || "Recurring"}</strong>{opp.deadline_note && <span className="block text-xs text-lilac mt-1">{opp.deadline_note}</span>}</span></p>
            <p className="flex items-center gap-2.5"><Wallet size={16} className="text-lilac shrink-0" /> <span className="text-white">{opp.funding_amount}</span></p>
            <p className="flex items-center gap-2.5"><MapPin size={16} className="text-lilac shrink-0" /> <span className="text-white">{opp.location}{opp.online_available ? " · Online available" : ""}</span></p>
            <p className="flex items-center gap-2.5"><FileText size={16} className="text-lilac shrink-0" /> <span>Fee: <span className="text-white">{opp.application_fee || "None"}</span></span></p>
            <p className="text-xs text-lilac pt-2 border-t border-white/10">Career stage: <span className="text-white">{opp.career_stage}</span> · Difficulty: <span className="text-white">{opp.difficulty}</span></p>
            <div className="space-y-2 pt-2">
              <a data-testid="source-link" href={opp.source_url} target="_blank" rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-flame text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-butter hover:text-ink transition-all">
                Open source <ExternalLink size={14} />
              </a>
              <button data-testid="detail-save-button" onClick={toggleSave}
                className="w-full inline-flex items-center justify-center gap-2 bg-butter text-ink px-4 py-3 rounded-full text-sm font-semibold hover:bg-lilac transition-all">
                {save ? <><BookmarkCheck size={15} /> Saved</> : <><Bookmark size={15} /> Save opportunity</>}
              </button>
            </div>
          </div>

          {user && user.role !== "admin" && (
            <div className="bg-white rounded-3xl p-6 bento">
              <p className="text-[10px] uppercase tracking-[0.25em] text-flame font-semibold mb-4">Track application</p>
              <div className="grid grid-cols-2 gap-2">
                {TRACK_STATUSES.map((s) => (
                  <button key={s} data-testid={`status-button-${s}`} onClick={() => setStatus(s)}
                    className={`text-xs font-medium px-3 py-2.5 rounded-full transition-all ${save?.status === s ? "bg-flame text-white" : "bg-lilac/30 text-ink hover:bg-lilac/60"}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {save && <p className="mt-4 text-xs text-ink/60">Current: <span className="text-flame font-semibold">{STATUS_LABELS[save.status]}</span></p>}
            </div>
          )}
        </aside>
      </div>

      {opp.similar?.length > 0 && (
        <section className="mt-16 pt-10 border-t border-lilac/40">
          <p className="section-num mb-3">More like this</p>
          <h2 className="font-display text-4xl sm:text-5xl text-ink mb-8">Similar opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {opp.similar.map((s, i) => <OpportunityCard key={s.id} opp={s} variant={cardVariantAt(i)} />)}
          </div>
        </section>
      )}
    </main>
  );
}
