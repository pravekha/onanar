import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import OpportunityCard from "../components/OpportunityCard";
import { DISCIPLINES, OPPORTUNITY_TYPES, CAREER_STAGES, DIFFICULTIES } from "../lib/constants";
import { toast } from "sonner";

const Select = ({ testId, value, onChange, options, placeholder }) => (
  <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)}
    className="border border-[#D8CFC2] bg-white rounded-sm px-3 py-2 text-sm focus:border-[#1F1F1F]">
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-2">Opportunity Directory</h1>
      <p className="text-sm text-[#7A7A7A] mb-8">{opps.length} opportunities · grants, residencies, fellowships, open calls and more.</p>

      <div className="bg-white border border-[#D8CFC2] rounded-sm p-4 mb-8">
        <div className="flex items-center gap-2 border border-[#D8CFC2] rounded-sm px-3 mb-3">
          <Search size={16} className="text-[#7A7A7A]" />
          <input data-testid="directory-search-input" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, organisation, tags, discipline…"
            className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={15} className="text-[#7A7A7A]" />
          <Select testId="filter-discipline" value={filters.discipline} onChange={set("discipline")} options={DISCIPLINES} placeholder="Discipline" />
          <Select testId="filter-type" value={filters.opportunity_type} onChange={set("opportunity_type")} options={OPPORTUNITY_TYPES} placeholder="Type" />
          <input data-testid="filter-location" value={filters.location} onChange={(e) => set("location")(e.target.value)}
            placeholder="Location" className="border border-[#D8CFC2] bg-white rounded-sm px-3 py-2 text-sm w-32 focus:border-[#1F1F1F]" />
          <Select testId="filter-career-stage" value={filters.career_stage} onChange={set("career_stage")} options={CAREER_STAGES} placeholder="Career stage" />
          <Select testId="filter-deadline" value={filters.deadline_status} onChange={set("deadline_status")}
            options={[{ value: "closing_soon", label: "Closing in 7 days" }, { value: "closing_month", label: "Closing in 30 days" }, { value: "open", label: "Open" }, { value: "rolling", label: "Recurring" }, { value: "closed", label: "Closed" }]}
            placeholder="Deadline status" />
          <Select testId="filter-difficulty" value={filters.difficulty} onChange={set("difficulty")} options={DIFFICULTIES} placeholder="Difficulty" />
          <button data-testid="clear-filters-button"
            onClick={() => { setSearch(""); setFilters({ discipline: "", opportunity_type: "", location: "", career_stage: "", deadline_status: "", difficulty: "" }); }}
            className="text-sm text-[#D94A2B] px-2 hover:underline">Clear</button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#7A7A7A] py-16">Loading opportunities…</p>
      ) : opps.length === 0 ? (
        <p data-testid="no-results" className="text-center text-sm text-[#7A7A7A] py-16">No opportunities match your filters.</p>
      ) : (
        <>
          <div data-testid="directory-grid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {opps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((o) => <OpportunityCard key={o.id} opp={o} saved={savedIds.has(o.id)} onToggleSave={toggleSave} />)}
          </div>
          {opps.length > PAGE_SIZE && (
            <div data-testid="pagination" className="mt-10 flex items-center justify-center gap-4">
              <button data-testid="pagination-prev" disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }}
                className="text-sm border border-[#1F1F1F] px-4 py-2 rounded-sm hover:bg-[#1F1F1F] hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none">
                ← Previous
              </button>
              <span className="text-sm text-[#7A7A7A]">Page {page} of {Math.ceil(opps.length / PAGE_SIZE)}</span>
              <button data-testid="pagination-next" disabled={page >= Math.ceil(opps.length / PAGE_SIZE)} onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }}
                className="text-sm border border-[#1F1F1F] px-4 py-2 rounded-sm hover:bg-[#1F1F1F] hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
