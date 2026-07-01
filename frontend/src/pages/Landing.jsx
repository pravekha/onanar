import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserRound, Compass, ClipboardCheck, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import OpportunityCard, { cardVariantAt } from "../components/OpportunityCard";
import { toast } from "sonner";

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [closing, setClosing] = useState([]);
  const [stats, setStats] = useState({ total: 0, disciplines: 0 });
  const [savedIds, setSavedIds] = useState(new Set());
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get("/opportunities", { params: { featured: true, limit: 100 } }).then((r) => {
      const open = r.data.filter((o) => o.deadline_state !== "closed");
      setFeatured(open.slice(0, 5));
      setClosing(open.filter((o) => o.deadline_state === "closing_soon").slice(0, 4));
      const disciplines = new Set();
      r.data.forEach((o) => (o.disciplines || []).forEach((d) => disciplines.add(d)));
      setStats({ total: r.data.length, disciplines: disciplines.size });
    });
    if (user && user.role !== "admin") {
      api.get("/saves").then((r) => setSavedIds(new Set(r.data.map((s) => s.opportunity_id))));
    }
  }, [user]);

  const toggleSave = async (opp) => {
    if (!user) { navigate("/login"); return; }
    if (savedIds.has(opp.id)) {
      await api.delete(`/saves/${opp.id}`);
      setSavedIds((p) => { const n = new Set(p); n.delete(opp.id); return n; });
      toast("Removed from tracker");
    } else {
      await api.post("/saves", { opportunity_id: opp.id });
      setSavedIds((p) => new Set(p).add(opp.id));
      toast.success("Saved to your tracker");
    }
  };

  return (
    <main className="bg-paper">
      {/* HERO — bento grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-16">
        <p className="section-num mb-6">00 / India&apos;s Opportunity Desk</p>
        <div className="grid grid-cols-12 gap-5">
          {/* Headline tile */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 md:p-12 bento flex flex-col justify-between min-h-[420px]">
            <div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[86px] leading-[0.95] text-ink tracking-tight">
                Creative<br />opportunities,<br />
                <span className="marker-butter">opened up.</span>
              </h1>
              <p className="mt-8 text-base md:text-lg text-ink/70 max-w-xl leading-relaxed">
                Grants, residencies, fellowships, scholarships and open calls for India&apos;s creative practitioners — searchable, matchable, all in one desk.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link data-testid="cta-find-opportunities" to="/opportunities"
                className="inline-flex items-center gap-2 bg-flame text-white px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-ink hover:text-butter transition-all group">
                Find opportunities <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link data-testid="cta-create-profile" to={user ? "/profile" : "/signup"}
                className="inline-flex items-center gap-2 bg-ink text-butter px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-lilac hover:text-ink transition-all">
                Create your profile
              </Link>
            </div>
          </div>

          {/* Hero image tile */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 rounded-3xl bento overflow-hidden min-h-[420px] relative">
            <img src="https://images.pexels.com/photos/5867750/pexels-photo-5867750.jpeg?auto=compress&w=800"
              alt="Artist at work" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xs uppercase tracking-[0.25em] text-butter/90 font-medium mb-1">Featured</p>
              <p className="font-display text-2xl text-white leading-tight">Craft, film, music, writing, research — one desk.</p>
            </div>
          </div>

          {/* Search pill — full width */}
          <div className="col-span-12 bg-ink rounded-3xl p-3 bento">
            <form data-testid="hero-search-form" className="flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); navigate(`/opportunities?search=${encodeURIComponent(query)}`); }}>
              <Search size={20} className="ml-4 text-butter" />
              <input data-testid="hero-search-input" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search grants, residencies, disciplines…"
                className="flex-1 px-3 py-3.5 text-base bg-transparent text-butter placeholder:text-lilac/70 focus:outline-none" />
              <button data-testid="hero-search-button" type="submit" className="bg-flame text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-butter hover:text-ink transition-all">
                Search
              </button>
            </form>
          </div>

          {/* Supporting stat tiles */}
          <div className="col-span-6 md:col-span-3 bg-butter rounded-3xl p-6 bento bento-hover">
            <p className="font-display text-6xl text-ink leading-none">{stats.total || "—"}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-ink/70 font-semibold">Live opportunities</p>
          </div>
          <div className="col-span-6 md:col-span-3 bg-lilac rounded-3xl p-6 bento bento-hover">
            <p className="font-display text-6xl text-ink leading-none">{stats.disciplines || "15"}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-ink/70 font-semibold">Disciplines covered</p>
          </div>
          <Link to="/opportunities" className="col-span-12 md:col-span-3 bg-flame rounded-3xl p-6 bento bento-hover flex flex-col justify-between text-ink group">
            <Sparkles size={22} />
            <div>
              <p className="font-display text-2xl leading-tight">Get matched to opportunities</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest inline-flex items-center gap-1">
                Start browsing <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </p>
            </div>
          </Link>
          <div className="col-span-12 md:col-span-3 bg-white rounded-3xl p-6 bento bento-hover">
            <p className="text-xs uppercase tracking-[0.25em] text-flame font-semibold mb-3">Types</p>
            <div className="flex flex-wrap gap-1.5">
              {["Grant", "Residency", "Fellowship", "Award", "Open Call", "Commission"].map((t) => (
                <span key={t} className="text-[11px] bg-lilac/50 text-ink px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED OPPORTUNITIES — asymmetric bento */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <p className="section-num mb-3">01 / Featured</p>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink leading-none">Handpicked <span className="marker-lilac">this week</span></h2>
            </div>
            <Link data-testid="view-all-link" to="/opportunities"
              className="text-sm text-flame font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all group">
              View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-12 gap-5 auto-rows-min">
            {featured[0] && (
              <div className="col-span-12 lg:col-span-6">
                <OpportunityCard opp={featured[0]} saved={savedIds.has(featured[0].id)} onToggleSave={toggleSave} variant="ink" featured />
              </div>
            )}
            {featured[1] && (
              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <OpportunityCard opp={featured[1]} saved={savedIds.has(featured[1].id)} onToggleSave={toggleSave} variant="butter" />
              </div>
            )}
            {featured[2] && (
              <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                <OpportunityCard opp={featured[2]} saved={savedIds.has(featured[2].id)} onToggleSave={toggleSave} variant="white" />
              </div>
            )}
            {featured[3] && (
              <div className="col-span-12 sm:col-span-6 lg:col-span-6">
                <OpportunityCard opp={featured[3]} saved={savedIds.has(featured[3].id)} onToggleSave={toggleSave} variant="lilac" />
              </div>
            )}
            {featured[4] && (
              <div className="col-span-12 sm:col-span-6 lg:col-span-6">
                <OpportunityCard opp={featured[4]} saved={savedIds.has(featured[4].id)} onToggleSave={toggleSave} variant="white" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* CLOSING SOON */}
      {closing.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          <div className="mb-8">
            <p className="section-num mb-3">02 / Closing soon</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink leading-none">Don&apos;t let these <span className="marker-butter">slip</span></h2>
            <p className="mt-3 text-sm text-ink/60">Deadlines within the next 7 days.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {closing.map((o, i) => (
              <OpportunityCard key={o.id} opp={o} saved={savedIds.has(o.id)} onToggleSave={toggleSave} variant={cardVariantAt(i + 3)} />
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS — dark indigo bento */}
      <section className="bg-ink text-butter">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20">
          <div className="grid grid-cols-12 gap-5 items-end mb-12">
            <div className="col-span-12 lg:col-span-8">
              <p className="section-num mb-4">03 / How it works</p>
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl text-butter leading-[0.95]">
                Three steps, <span className="marker-lilac">one desk.</span>
              </h2>
            </div>
            <p className="col-span-12 lg:col-span-4 text-base text-lilac leading-relaxed">
              Discovery, matching and tracking — designed for the reality of Indian creative practice.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-5">
            {[
              { icon: UserRound, n: "01", t: "Create your profile", d: "Tell us your discipline, city, career stage and interests. Two minutes, once.", bg: "bg-lilac", txt: "text-ink" },
              { icon: Compass, n: "02", t: "Discover matches", d: "Every listing gets a match score against your profile — with the reasons why.", bg: "bg-butter", txt: "text-ink" },
              { icon: ClipboardCheck, n: "03", t: "Save and track", d: "Move opportunities from Interested to Applied to Accepted, with notes and deadlines.", bg: "bg-flame", txt: "text-ink" },
            ].map((s) => (
              <div key={s.n} className={`col-span-12 md:col-span-4 rounded-3xl p-8 bento bento-hover ${s.bg} ${s.txt} flex flex-col gap-6 min-h-[280px]`}>
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-ink text-butter flex items-center justify-center">
                    <s.icon size={26} />
                  </div>
                  <span className="font-display text-5xl leading-none opacity-70">{s.n}</span>
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-3xl leading-tight">{s.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed opacity-85">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink border-t border-lilac/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex flex-wrap justify-between items-center gap-4 text-sm text-lilac">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl text-butter">Onanar</span>
            <span className="text-xs uppercase tracking-[0.25em] text-lilac/70">Creative opportunities, opened up.</span>
          </div>
          <span className="text-xs text-lilac/60">© {new Date().getFullYear()} Onanar</span>
        </div>
      </footer>
    </main>
  );
}
