import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, BadgeCheck, Eye, EyeOff, XCircle, Archive } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

const STATUS_COLORS = {
  published: "text-flame", draft: "text-ink/50", closed: "text-ink/40", archived: "text-ink/40 line-through",
};

const STAT_BG = ["bg-flame", "bg-butter", "bg-lilac", "bg-ink"];
const STAT_TXT = ["text-ink", "text-ink", "text-ink", "text-butter"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [opps, setOpps] = useState([]);

  const load = useCallback(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/opportunities").then((r) => setOpps(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (id, body, msg) => {
    await api.patch(`/admin/opportunities/${id}`, body);
    toast.success(msg);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this opportunity permanently?")) return;
    await api.delete(`/admin/opportunities/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 md:gap-5 mb-6">
        <div className="col-span-12 md:col-span-8 bg-white rounded-3xl p-8 bento">
          <p className="section-num mb-3">01 / Admin</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink">
            Curate the <span className="marker-butter">desk</span>.
          </h1>
          <p className="mt-4 text-sm text-ink/70">Manage listings, verification and publication.</p>
        </div>
        <Link data-testid="add-opportunity-button" to="/admin/opportunities/new"
          className="col-span-12 md:col-span-4 bg-flame rounded-3xl p-8 bento bento-hover flex flex-col justify-between text-ink group">
          <Plus size={28} strokeWidth={2.5} />
          <div>
            <p className="font-display text-3xl leading-tight">Add opportunity</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest">Create a new listing →</p>
          </div>
        </Link>
      </div>

      {stats && (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
            {[
              { label: "Total opportunities", value: stats.total, testId: "stat-total" },
              { label: "Open opportunities", value: stats.open, testId: "stat-open" },
              { label: "Verified", value: stats.verified, testId: "stat-verified" },
              { label: "Closing in 7 days", value: stats.closing_7_days, testId: "stat-closing" },
            ].map((c, i) => (
              <div key={c.label} data-testid={c.testId} className={`${STAT_BG[i]} ${STAT_TXT[i]} rounded-3xl p-6 bento bento-hover flex flex-col justify-between min-h-[140px]`}>
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold opacity-80">{c.label}</p>
                <p className="font-display text-6xl leading-none">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Distribution tiles */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 mb-8">
            <div className="bg-white rounded-3xl p-6 bento">
              <p className="section-num mb-4">By discipline</p>
              <div className="space-y-2">
                {stats.by_discipline.slice(0, 8).map(([d, n]) => (
                  <div key={d} className="flex items-center gap-3 text-sm">
                    <span className="w-36 truncate text-ink">{d}</span>
                    <div className="flex-1 h-2 bg-lilac/30 rounded-full overflow-hidden">
                      <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${(n / stats.total) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-ink/60 font-medium">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-butter rounded-3xl p-6 bento">
              <p className="section-num mb-4">By type</p>
              <div className="space-y-2">
                {stats.by_type.slice(0, 8).map(([t, n]) => (
                  <div key={t} className="flex items-center gap-3 text-sm">
                    <span className="w-36 truncate text-ink">{t}</span>
                    <div className="flex-1 h-2 bg-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-flame rounded-full transition-all" style={{ width: `${(n / stats.total) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-ink/60 font-medium">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Table tile */}
      <div className="bg-white rounded-3xl overflow-hidden bento">
        <div className="px-6 py-5 border-b border-lilac/40">
          <p className="section-num">Listings</p>
          <h2 className="font-display text-3xl text-ink mt-1">All opportunities</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-lilac/40 text-left text-[10px] uppercase tracking-[0.2em] text-ink/60 font-semibold">
                <th className="px-6 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opps.map((o) => (
                <tr key={o.id} data-testid={`admin-row-${o.id}`} className="border-b border-lilac/20 hover:bg-lilac/10 transition-colors">
                  <td className="px-6 py-3">
                    <Link to={`/opportunities/${o.id}`} className="font-medium text-ink hover:text-flame">{o.title}</Link>
                    <p className="text-xs text-ink/50 mt-0.5">{o.organisation}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/80">{o.opportunity_type}</td>
                  <td className="px-4 py-3 text-ink/80">{o.deadline || "Recurring"}</td>
                  <td className={`px-4 py-3 capitalize font-medium ${STATUS_COLORS[o.status] || ""}`}>{o.status}</td>
                  <td className="px-4 py-3">{o.verified ? <BadgeCheck size={16} className="text-flame" /> : <span className="text-ink/30">—</span>}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1 text-ink/50">
                      <Link data-testid={`edit-${o.id}`} to={`/admin/opportunities/${o.id}/edit`} title="Edit" className="p-1.5 rounded-full hover:bg-lilac/40 hover:text-ink transition-colors"><Pencil size={14} /></Link>
                      <button data-testid={`verify-${o.id}`} title={o.verified ? "Unverify" : "Mark verified"}
                        onClick={() => patch(o.id, { verified: !o.verified }, o.verified ? "Unverified" : "Marked as verified")}
                        className="p-1.5 rounded-full hover:bg-butter hover:text-ink transition-colors"><BadgeCheck size={14} /></button>
                      <button data-testid={`publish-${o.id}`} title={o.status === "published" ? "Unpublish" : "Publish"}
                        onClick={() => patch(o.id, { status: o.status === "published" ? "draft" : "published" }, o.status === "published" ? "Unpublished" : "Published")}
                        className="p-1.5 rounded-full hover:bg-lilac/40 hover:text-ink transition-colors">{o.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button data-testid={`close-${o.id}`} title="Close" onClick={() => patch(o.id, { status: "closed" }, "Closed")} className="p-1.5 rounded-full hover:bg-flame hover:text-white transition-colors"><XCircle size={14} /></button>
                      <button data-testid={`archive-${o.id}`} title="Archive" onClick={() => patch(o.id, { status: "archived" }, "Archived")} className="p-1.5 rounded-full hover:bg-lilac/40 hover:text-ink transition-colors"><Archive size={14} /></button>
                      <button data-testid={`delete-${o.id}`} title="Delete" onClick={() => remove(o.id)} className="p-1.5 rounded-full hover:bg-flame hover:text-white transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
