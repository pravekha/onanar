import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES, SOURCE_TYPES, DIFFICULTIES } from "../lib/constants";
import { toast } from "sonner";

const input = "w-full bg-white rounded-full px-4 py-2.5 text-sm border border-lilac/40 focus:border-ink focus:outline-none placeholder:text-ink/40";
const textarea = "w-full bg-white rounded-2xl px-4 py-3 text-sm border border-lilac/40 focus:border-ink focus:outline-none placeholder:text-ink/40";
const label = "text-[10px] uppercase tracking-[0.25em] text-ink/60 font-semibold block mb-1.5 ml-4";

export default function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState({
    title: "", organisation: "", opportunity_type: "Grant", disciplines: [], location: "",
    online_available: false, funding_amount: "", deadline: "", deadline_note: "", summary: "", description: "",
    eligibility: "", application_fee: "None", difficulty: "Medium", career_stage: "Any",
    source_url: "", source_type: "Foundation", verified: false, status: "published",
  });
  const [docsText, setDocsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/opportunities/${id}`).then((r) => {
        const o = r.data;
        setF({ ...o });
        setDocsText((o.required_documents || []).join(", "));
        setTagsText((o.tags || []).join(", "));
      });
    }
  }, [id]);

  const toggleDisc = (d) =>
    setF((p) => ({ ...p, disciplines: p.disciplines.includes(d) ? p.disciplines.filter((x) => x !== d) : [...p.disciplines, d] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        title: f.title, organisation: f.organisation, opportunity_type: f.opportunity_type,
        disciplines: f.disciplines, location: f.location, online_available: f.online_available,
        funding_amount: f.funding_amount, deadline: f.deadline || "", deadline_note: f.deadline_note || "", summary: f.summary,
        description: f.description, eligibility: f.eligibility,
        required_documents: docsText.split(",").map((s) => s.trim()).filter(Boolean),
        application_fee: f.application_fee, difficulty: f.difficulty, career_stage: f.career_stage,
        source_url: f.source_url, source_type: f.source_type,
        tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
        verified: f.verified, status: f.status,
      };
      if (id) {
        await api.put(`/admin/opportunities/${id}`, body);
        toast.success("Opportunity updated");
      } else {
        await api.post("/admin/opportunities", body);
        toast.success("Opportunity created");
      }
      navigate("/admin");
    } catch (err) {
      toast.error("Could not save — check required fields");
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      <div className="bg-white rounded-3xl p-8 bento mb-6">
        <p className="section-num mb-3">{id ? "Edit" : "New"}</p>
        <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink">
          {id ? <>Edit <span className="marker-lilac">opportunity</span>.</> : <>Add an <span className="marker-butter">opportunity</span>.</>}
        </h1>
      </div>

      <form onSubmit={submit} className="bg-white rounded-3xl p-8 md:p-10 bento space-y-6">
        <section className="space-y-4">
          <p className="section-num">Basics</p>
          <div><label className={label}>Title *</label><input data-testid="opp-title" required value={f.title} onChange={set("title")} className={input} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={label}>Organisation *</label><input data-testid="opp-organisation" required value={f.organisation} onChange={set("organisation")} className={input} /></div>
            <div>
              <label className={label}>Opportunity type</label>
              <select data-testid="opp-type" value={f.opportunity_type} onChange={set("opportunity_type")} className={input}>
                {OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={label + " ml-0"}>Disciplines</label>
            <div data-testid="opp-disciplines" className="flex flex-wrap gap-1.5">
              {DISCIPLINES.map((d) => (
                <button key={d} type="button" onClick={() => toggleDisc(d)}
                  className={`text-xs font-medium px-3.5 py-2 rounded-full transition-all ${f.disciplines.includes(d) ? "bg-ink text-butter" : "bg-lilac/30 text-ink hover:bg-lilac/60"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Details</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={label}>Location</label><input data-testid="opp-location" value={f.location} onChange={set("location")} className={input} placeholder="City, State or Pan-India" /></div>
            <div><label className={label}>Funding / benefit</label><input data-testid="opp-funding" value={f.funding_amount} onChange={set("funding_amount")} className={input} placeholder="₹2,00,000 + mentorship" /></div>
            <div><label className={label}>Deadline</label><input data-testid="opp-deadline" type="date" value={f.deadline} onChange={set("deadline")} className={input} /></div>
            <div><label className={label}>Deadline note (recurring)</label><input data-testid="opp-deadline-note" value={f.deadline_note} onChange={set("deadline_note")} className={input} placeholder="e.g. Annual cycle, opens Aug" /></div>
            <div><label className={label}>Application fee</label><input data-testid="opp-fee" value={f.application_fee} onChange={set("application_fee")} className={input} /></div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Content</p>
          <div><label className={label}>Summary</label><textarea data-testid="opp-summary" rows={2} value={f.summary} onChange={set("summary")} className={textarea} /></div>
          <div><label className={label}>Full description</label><textarea data-testid="opp-description" rows={4} value={f.description} onChange={set("description")} className={textarea} /></div>
          <div><label className={label}>Eligibility</label><textarea data-testid="opp-eligibility" rows={2} value={f.eligibility} onChange={set("eligibility")} className={textarea} /></div>
          <div><label className={label}>Required documents (comma-separated)</label><input data-testid="opp-documents" value={docsText} onChange={(e) => setDocsText(e.target.value)} className={input} placeholder="Portfolio, CV, Statement" /></div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Metadata</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={label}>Difficulty</label>
              <select data-testid="opp-difficulty" value={f.difficulty} onChange={set("difficulty")} className={input}>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select>
            </div>
            <div>
              <label className={label}>Career stage</label>
              <select data-testid="opp-career-stage" value={f.career_stage} onChange={set("career_stage")} className={input}>
                <option>Any</option>
                {CAREER_STAGES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Source type</label>
              <select data-testid="opp-source-type" value={f.source_type} onChange={set("source_type")} className={input}>{SOURCE_TYPES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
          </div>
          <div><label className={label}>Source URL</label><input data-testid="opp-source-url" value={f.source_url} onChange={set("source_url")} className={input} placeholder="https://" /></div>
          <div><label className={label}>Tags (comma-separated)</label><input data-testid="opp-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={input} placeholder="residency, folk, grant" /></div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-ink pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input data-testid="opp-online" type="checkbox" checked={f.online_available} onChange={set("online_available")} className="accent-flame w-4 h-4" /> Online available
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input data-testid="opp-verified" type="checkbox" checked={f.verified} onChange={set("verified")} className="accent-flame w-4 h-4" /> Verified
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-ink/60 font-semibold">Status</span>
              <select data-testid="opp-status" value={f.status} onChange={set("status")} className="bg-white rounded-full px-4 py-2 text-sm border border-lilac/40 focus:border-ink focus:outline-none">
                {["draft", "published", "closed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <button data-testid="opp-submit-button" disabled={busy} type="submit"
            className="bg-flame text-white px-10 py-3.5 rounded-full text-sm font-semibold hover:bg-ink hover:text-butter transition-all disabled:opacity-60">
            {busy ? "Saving…" : id ? "Update opportunity" : "Create opportunity"}
          </button>
          <button type="button" onClick={() => navigate("/admin")}
            className="bg-lilac/30 text-ink px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-lilac transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
