import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserRound, Compass, ClipboardCheck, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import OpportunityCard from "../components/OpportunityCard";
import { toast } from "sonner";

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [closing, setClosing] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get("/opportunities", { params: { featured: true, limit: 100 } }).then((r) => {
      const open = r.data.filter((o) => o.deadline_state !== "closed");
      setFeatured(open.slice(0, 4));
      setClosing(open.filter((o) => o.deadline_state === "closing_soon").slice(0, 4));
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
    <main>
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-12 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.25em] text-[#D94A2B] mb-5">India's Opportunity Desk for Creative Practitioners</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-none text-[#1F1F1F]">
            Creative opportunities,<br />opened up.
          </h1>
          <p className="mt-6 text-base md:text-lg text-[#1F1F1F]/75 max-w-xl leading-relaxed">
            Discover grants, residencies, fellowships, scholarships, open calls, and cultural opportunities for India's creative practitioners.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link data-testid="cta-find-opportunities" to="/opportunities"
              className="bg-[#D94A2B] text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors">
              Find Opportunities
            </Link>
            <Link data-testid="cta-create-profile" to={user ? "/profile" : "/signup"}
              className="border border-[#1F1F1F] px-6 py-3 rounded-sm text-sm font-medium hover:bg-[#1F1F1F] hover:text-white transition-colors">
              Create Your Profile
            </Link>
          </div>
          <form data-testid="hero-search-form" className="mt-8 flex max-w-xl border border-[#D8CFC2] bg-white rounded-sm"
            onSubmit={(e) => { e.preventDefault(); navigate(`/opportunities?search=${encodeURIComponent(query)}`); }}>
            <Search size={18} className="ml-4 self-center text-[#7A7A7A]" />
            <input data-testid="hero-search-input" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search grants, residencies, disciplines…"
              className="flex-1 px-3 py-3 text-sm bg-transparent focus:outline-none" />
            <button data-testid="hero-search-button" type="submit" className="px-5 text-sm font-medium text-[#D94A2B] hover:bg-[#F7F2EA] transition-colors">Search</button>
          </form>
        </div>
        <div className="lg:col-span-5 hidden lg:block">
          <img src="https://images.pexels.com/photos/5867750/pexels-photo-5867750.jpeg?auto=compress&w=800"
            alt="Artisan crafting clay sculpture" className="w-full h-[430px] object-cover rounded-sm border border-[#D8CFC2]" />
          <p className="text-xs text-[#7A7A7A] mt-2 tracking-wide">Craft, film, music, writing, research — one desk for every practice.</p>
        </div>
      </section>

      <section className="border-t border-[#D8CFC2] bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Featured opportunities</h2>
            <Link data-testid="view-all-link" to="/opportunities" className="text-sm text-[#D94A2B] inline-flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((o) => <OpportunityCard key={o.id} opp={o} saved={savedIds.has(o.id)} onToggleSave={toggleSave} />)}
          </div>
        </div>
      </section>

      {closing.length > 0 && (
        <section className="border-t border-[#D8CFC2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Closing soon</h2>
            <p className="text-sm text-[#7A7A7A] mb-8">Deadlines within the next 7 days. Don't let these slip.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {closing.map((o) => <OpportunityCard key={o.id} opp={o} saved={savedIds.has(o.id)} onToggleSave={toggleSave} />)}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-[#D8CFC2] bg-[#1F1F1F] text-[#F7F2EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: UserRound, n: "01", t: "Create your profile", d: "Tell us your discipline, city, career stage and interests. Two minutes, once." },
              { icon: Compass, n: "02", t: "Discover matched opportunities", d: "Every listing gets a match score against your profile — with the reasons why." },
              { icon: ClipboardCheck, n: "03", t: "Save and track applications", d: "Move opportunities from Interested to Applied to Accepted, with notes and deadlines." },
            ].map((s) => (
              <div key={s.n} className="border-t border-[#F7F2EA]/20 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <s.icon size={20} className="text-[#D94A2B]" />
                  <span className="text-xs tracking-widest text-[#F7F2EA]/50">{s.n}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{s.t}</h3>
                <p className="text-sm text-[#F7F2EA]/70 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#D8CFC2] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap justify-between gap-4 text-sm text-[#7A7A7A]">
          <span className="font-display text-lg text-[#1F1F1F]">Onanar</span>
          <span>Creative opportunities, opened up.</span>
        </div>
      </footer>
    </main>
  );
}
