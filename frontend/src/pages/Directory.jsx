import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import OpportunityCard, { cardVariantAt } from "../components/OpportunityCard";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES, DIFFICULTIES } from "../lib/constants";
import { toast } from "sonner";

const selectCls = "bg-white text-ink rounded-full px-4 py-2 text-sm font-medium border border-lilac/40 focus:border-ink focus:outline-none cursor-pointer";

const Select = ({ testId, value, onChange, options, placeholder }) => (
  <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
    <option value="">{placeholder}</option>
    {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
);

export default function Directory() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [filters, setFilters] = useState({ discipline: "", opportunity_type: "", location: "", career_stage: "", deadline_status: "", difficulty: "" });
  const [opps, setOpps] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchOpps = useCallback(() => {
    setLoading(true);
    api.get("/opportunities", { params: { search, ...filters } })
      .then((r) => { setOpps(r.data); setPage(1); })
      .finally(() => setLoading(false));
  }, [search, filters]);

  useEffect(() => { const t = setTimeout(fetchOpps, 300); return () => clearTimeout(t); }, [fetchOpps]);

  useEffect(() => {
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

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const activeCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);
  const shown = opps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(opps.length / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 bg-paper">
      <p className="section-num mb-4">01 / Directory</p>
      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 bento">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-ink">
            The <span className="marker-butter">opportunity</span> directory.
          </h1>
          <p className="mt-5 text-base text-ink/70">
            {opps.length} listing{opps.length === 1 ? "" : "s"} · grants, residencies, fellowships, open calls and more.
          </p>
        </div>
        <div className="col-span-6 lg:col-span-2 bg-flame rounded-3xl p-6 bento flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-ink/80">Total</span>
          <p className="font-display text-6xl text-ink leading-none">{opps.length}</p>
        </div>
        <div className="col-span-6 lg:col-span-2 bg-lilac rounded-3xl p-6 bento flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-ink/70">Filters active</span>
          <p className="font-display text-6xl text-ink leading-none">{activeCount}</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-ink rounded-3xl p-5 md:p-6 mb-8 bento">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 mb-4">
          <Search size={18} className="text-ink/60" />
          <input data-testid="directory-search-input" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, organisation, tags, discipline…"
            className="flex-1 py-3 text-sm bg-transparent text-ink placeholder:text-ink/50 focus:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} className="text-ink/50 hover:text-flame"><X size={16} /></button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={16} className="text-butter" />
          <Select testId="filter-discipline" value={filters.discipline} onChange={set("discipline")} options={DISCIPLINES} placeholder="Discipline" />
          <Select testId="filter-type" value={filters.opportunity_type} onChange={set("opportunity_type")} options={OPPORTUNITY_TYPES} placeholder="Type" />
          <input data-testid="filter-location" value={filters.location} onChange={(e) => set("location")(e.target.value)}
            placeholder="Location" className="bg-white text-ink rounded-full px-4 py-2 text-sm w-32 focus:outline-none border border-lilac/40 focus:border-ink placeholder:text-ink/40" />
          <Select testId="filter-career-stage" value={filters.career_stage} onChange={set("career_stage")} options={CAREER_STAGES} placeholder="Career stage" />
          <Select testId="filter-deadline" value={filters.deadline_status} onChange={set("deadline_status")}
            options={[{ value: "closing_soon", label: "Closing in 7 days" }, { value: "closing_month", label: "Closing in 30 days" }, { value: "open", label: "Open" }, { value: "rolling", label: "Recurring" }, { value: "closed", label: "Closed" }]}
            placeholder="Deadline" />
          <Select testId="filter-difficulty" value={filters.difficulty} onChange={set("difficulty")} options={DIFFICULTIES} placeholder="Difficulty" />
          <button data-testid="clear-filters-button"
            onClick={() => { setSearch(""); setFilters({ discipline: "", opportunity_type: "", location: "", career_stage: "", deadline_status: "", difficulty: "" }); }}
            className="text-sm text-butter font-medium px-4 py-2 rounded-full hover:bg-flame hover:text-white transition-colors">Clear all</button>
        </div>
      </div>

      {/* RESULTS */}
      {loading ? (
        <p className="text-center text-sm text-ink/60 py-16">Loading opportunities…</p>
      ) : opps.length === 0 ? (
        <div data-testid="no-results" className="text-center py-24 bg-white rounded-3xl bento">
          <p className="font-display text-3xl text-ink mb-2">No matches.</p>
          <p className="text-sm text-ink/60">Try clearing a filter or broadening your search.</p>
        </div>
      ) : (
        <>
          <div data-testid="directory-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shown.map((o, i) => (
              <OpportunityCard key={o.id} opp={o} saved={savedIds.has(o.id)} onToggleSave={toggleSave} variant={cardVariantAt(i)} />
            ))}
          </div>
          {opps.length > PAGE_SIZE && (
            <div data-testid="pagination" className="mt-12 flex items-center justify-center gap-3">
              <button data-testid="pagination-prev" disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }}
                className="text-sm bg-ink text-butter px-5 py-2.5 rounded-full hover:bg-flame hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none">
                ← Previous
              </button>
              <span className="text-sm text-ink/70 px-4 font-medium">Page {page} of {totalPages}</span>
              <button data-testid="pagination-next" disabled={page >= totalPages} onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }}
                className="text-sm bg-ink text-butter px-5 py-2.5 rounded-full hover:bg-flame hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
