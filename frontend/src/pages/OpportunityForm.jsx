import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES, SOURCE_TYPES, DIFFICULTIES } from "../lib/constants";
import { toast } from "sonner";

const input = "w-full border border-[#D8CFC2] bg-white rounded-sm px-3 py-2.5 text-sm focus:border-[#1F1F1F]";
const label = "text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1";

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
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display text-4xl font-semibold tracking-tight mb-8">{id ? "Edit opportunity" : "Add opportunity"}</h1>
      <form onSubmit={submit} className="bg-white border border-[#D8CFC2] rounded-sm p-6 sm:p-8 space-y-5">
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
          <label className={label}>Disciplines</label>
          <div data-testid="opp-disciplines" className="flex flex-wrap gap-1.5">
            {DISCIPLINES.map((d) => (
              <button key={d} type="button" onClick={() => toggleDisc(d)}
                className={`text-xs px-2.5 py-1.5 rounded-sm border transition-colors ${f.disciplines.includes(d) ? "bg-[#1F1F1F] text-white border-[#1F1F1F]" : "border-[#D8CFC2] hover:border-[#1F1F1F]"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label}>Location</label><input data-testid="opp-location" value={f.location} onChange={set("location")} className={input} placeholder="City, State or Pan-India" /></div>
          <div><label className={label}>Funding amount / benefit</label><input data-testid="opp-funding" value={f.funding_amount} onChange={set("funding_amount")} className={input} placeholder="₹2,00,000 + mentorship" /></div>
          <div><label className={label}>Deadline (leave empty if recurring)</label><input data-testid="opp-deadline" type="date" value={f.deadline} onChange={set("deadline")} className={input} /></div>
          <div><label className={label}>Deadline note (for recurring cycles)</label><input data-testid="opp-deadline-note" value={f.deadline_note} onChange={set("deadline_note")} className={input} placeholder="e.g. Annual cycle, opens Aug" /></div>
          <div><label className={label}>Application fee</label><input data-testid="opp-fee" value={f.application_fee} onChange={set("application_fee")} className={input} /></div>
        </div>
        <div><label className={label}>Summary</label><textarea data-testid="opp-summary" rows={2} value={f.summary} onChange={set("summary")} className={input} /></div>
        <div><label className={label}>Full description</label><textarea data-testid="opp-description" rows={4} value={f.description} onChange={set("description")} className={input} /></div>
        <div><label className={label}>Eligibility</label><textarea data-testid="opp-eligibility" rows={2} value={f.eligibility} onChange={set("eligibility")} className={input} /></div>
        <div><label className={label}>Required documents (comma-separated)</label><input data-testid="opp-documents" value={docsText} onChange={(e) => setDocsText(e.target.value)} className={input} placeholder="Portfolio, CV, Statement" /></div>
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
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input data-testid="opp-online" type="checkbox" checked={f.online_available} onChange={set("online_available")} className="accent-[#D94A2B]" /> Online available
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input data-testid="opp-verified" type="checkbox" checked={f.verified} onChange={set("verified")} className="accent-[#D94A2B]" /> Verified
          </label>
          <div className="flex items-center gap-2">
            <span className={label + " mb-0"}>Status</span>
            <select data-testid="opp-status" value={f.status} onChange={set("status")} className="border border-[#D8CFC2] rounded-sm px-3 py-2 text-sm">
              {["draft", "published", "closed", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button data-testid="opp-submit-button" disabled={busy} type="submit"
            className="bg-[#D94A2B] text-white px-8 py-2.5 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors disabled:opacity-60">
            {busy ? "Saving…" : id ? "Update opportunity" : "Create opportunity"}
          </button>
          <button type="button" onClick={() => navigate("/admin")} className="border border-[#1F1F1F] px-6 py-2.5 rounded-sm text-sm hover:bg-[#1F1F1F] hover:text-white transition-colors">Cancel</button>
        </div>
      </form>
    </main>
  );
}
