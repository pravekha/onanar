import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES } from "../lib/constants";
import { toast } from "sonner";

const input = "w-full bg-white rounded-full px-4 py-2.5 text-sm border border-lilac/40 focus:border-ink focus:outline-none placeholder:text-ink/40";
const label = "text-[10px] uppercase tracking-[0.25em] text-ink/60 font-semibold block mb-1.5 ml-4";

function MultiCheck({ options, value, onChange, testId }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <div data-testid={testId} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`text-xs font-medium px-3.5 py-2 rounded-full transition-all ${value.includes(o) ? "bg-ink text-butter" : "bg-lilac/30 text-ink hover:bg-lilac/60"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState({
    name: "", city: "", state: "", country: "India", primary_discipline: "",
    secondary_disciplines: [], career_stage: "", student_status: "", age_range: "",
    portfolio_link: "", website_link: "", instagram_link: "", languages: [],
    keywords: [], preferred_types: [], willing_to_travel: true, online_only: false,
    application_experience: "Beginner",
  });
  const [langText, setLangText] = useState("");
  const [kwText, setKwText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/profile").then((r) => {
      if (r.data && r.data.user_id) {
        setP((prev) => ({ ...prev, ...r.data }));
        setLangText((r.data.languages || []).join(", "));
        setKwText((r.data.keywords || []).join(", "));
      } else if (user) {
        setP((prev) => ({ ...prev, name: user.name }));
      }
    });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...p,
        languages: langText.split(",").map((s) => s.trim()).filter(Boolean),
        keywords: kwText.split(",").map((s) => s.trim()).filter(Boolean),
      };
      delete body.user_id; delete body.email; delete body.updated_at;
      await api.put("/profile", body);
      toast.success("Profile saved — match scores are now active");
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setP({ ...p, [k]: e.target?.value ?? e });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      {/* Header bento */}
      <div className="grid grid-cols-12 gap-4 md:gap-5 mb-6">
        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-8 bento">
          <p className="section-num mb-3">01 / Profile</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink">Your <span className="marker-butter">practice</span>.</h1>
          <p className="mt-4 text-sm text-ink/70">Your profile powers match scores across every opportunity.</p>
        </div>
        <div className="col-span-12 md:col-span-4 bg-lilac rounded-3xl p-8 bento flex flex-col justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-ink/70 font-semibold">Signed in as</p>
          <div>
            <p className="font-display text-2xl text-ink leading-tight break-all">{user?.name}</p>
            <p className="text-xs text-ink/70 mt-1 break-all">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="bg-white rounded-3xl p-8 md:p-10 bento space-y-8">
        <section className="space-y-4">
          <p className="section-num">Basics</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={label}>Name</label><input data-testid="profile-name" value={p.name} onChange={set("name")} className={input} /></div>
            <div><label className={label}>Email</label><input value={user?.email || ""} disabled className={`${input} opacity-60`} /></div>
            <div><label className={label}>City</label><input data-testid="profile-city" value={p.city} onChange={set("city")} className={input} placeholder="e.g. Kochi" /></div>
            <div><label className={label}>State</label><input data-testid="profile-state" value={p.state} onChange={set("state")} className={input} placeholder="e.g. Kerala" /></div>
            <div><label className={label}>Country</label><input data-testid="profile-country" value={p.country} onChange={set("country")} className={input} /></div>
            <div>
              <label className={label}>Age range</label>
              <select data-testid="profile-age-range" value={p.age_range} onChange={set("age_range")} className={input}>
                <option value="">Select</option>
                {["Under 18", "18-24", "25-34", "35-44", "45-59", "60+"].map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Discipline</p>
          <div>
            <label className={label}>Primary discipline</label>
            <select data-testid="profile-primary-discipline" value={p.primary_discipline} onChange={set("primary_discipline")} className={input}>
              <option value="">Select discipline</option>
              {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={label + " ml-0"}>Secondary disciplines</label>
            <MultiCheck testId="profile-secondary-disciplines" options={DISCIPLINES} value={p.secondary_disciplines} onChange={set("secondary_disciplines")} />
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Career</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={label}>Career stage</label>
              <select data-testid="profile-career-stage" value={p.career_stage} onChange={set("career_stage")} className={input}>
                <option value="">Select</option>
                {CAREER_STAGES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Student / professional</label>
              <select data-testid="profile-student-status" value={p.student_status} onChange={set("student_status")} className={input}>
                <option value="">Select</option>
                {["Student", "Working professional", "Independent practitioner"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Application experience</label>
              <select data-testid="profile-application-experience" value={p.application_experience} onChange={set("application_experience")} className={input}>
                {["Beginner", "Intermediate", "Experienced"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Links</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className={label}>Portfolio</label><input data-testid="profile-portfolio" value={p.portfolio_link} onChange={set("portfolio_link")} className={input} placeholder="https://" /></div>
            <div><label className={label}>Website</label><input data-testid="profile-website" value={p.website_link} onChange={set("website_link")} className={input} placeholder="https://" /></div>
            <div><label className={label}>Instagram</label><input data-testid="profile-instagram" value={p.instagram_link} onChange={set("instagram_link")} className={input} placeholder="@handle" /></div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="section-num">Interests</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={label}>Languages</label><input data-testid="profile-languages" value={langText} onChange={(e) => setLangText(e.target.value)} className={input} placeholder="Hindi, English, Tamil" /></div>
            <div><label className={label}>Keywords</label><input data-testid="profile-keywords" value={kwText} onChange={(e) => setKwText(e.target.value)} className={input} placeholder="residency, folk, documentary" /></div>
          </div>
          <div>
            <label className={label + " ml-0"}>Preferred opportunity types</label>
            <MultiCheck testId="profile-preferred-types" options={OPPORTUNITY_TYPES} value={p.preferred_types} onChange={set("preferred_types")} />
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-ink pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input data-testid="profile-willing-travel" type="checkbox" checked={p.willing_to_travel} onChange={(e) => setP({ ...p, willing_to_travel: e.target.checked })} className="accent-flame w-4 h-4" />
              Willing to travel
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input data-testid="profile-online-only" type="checkbox" checked={p.online_only} onChange={(e) => setP({ ...p, online_only: e.target.checked })} className="accent-flame w-4 h-4" />
              Online-only preference
            </label>
          </div>
        </section>

        <button data-testid="profile-save-button" disabled={busy} type="submit"
          className="bg-flame text-white px-10 py-3.5 rounded-full text-sm font-semibold hover:bg-ink hover:text-butter transition-all disabled:opacity-60">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
