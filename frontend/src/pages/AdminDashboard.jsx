import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, BadgeCheck, Eye, EyeOff, XCircle, Archive } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

const STATUS_COLORS = {
  published: "text-[#4F6F52]", draft: "text-[#7A7A7A]", closed: "text-[#D94A2B]", archived: "text-[#7A7A7A] line-through",
};

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
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-[#7A7A7A] mt-1">Manage listings, verification and publication.</p>
        </div>
        <Link data-testid="add-opportunity-button" to="/admin/opportunities/new"
          className="inline-flex items-center gap-2 bg-[#D94A2B] text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors">
          <Plus size={16} /> Add opportunity
        </Link>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total opportunities", value: stats.total, testId: "stat-total" },
              { label: "Open opportunities", value: stats.open, testId: "stat-open" },
              { label: "Verified", value: stats.verified, testId: "stat-verified" },
              { label: "Closing in 7 days", value: stats.closing_7_days, testId: "stat-closing" },
            ].map((c) => (
              <div key={c.label} data-testid={c.testId} className="bg-white border border-[#D8CFC2] rounded-sm p-5">
                <p className="font-display text-4xl font-semibold text-[#D94A2B]">{c.value}</p>
                <p className="text-xs uppercase tracking-widest text-[#7A7A7A] mt-1">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <div className="bg-white border border-[#D8CFC2] rounded-sm p-5">
              <p className="text-xs uppercase tracking-widest text-[#7A7A7A] mb-3">By discipline</p>
              <div className="space-y-1.5">
                {stats.by_discipline.slice(0, 8).map(([d, n]) => (
                  <div key={d} className="flex items-center gap-2 text-sm">
                    <span className="w-40 truncate">{d}</span>
                    <div className="flex-1 h-2 bg-[#F7F2EA] rounded-full"><div className="h-full bg-[#4F6F52] rounded-full" style={{ width: `${(n / stats.total) * 100}%` }} /></div>
                    <span className="w-6 text-right text-[#7A7A7A]">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#D8CFC2] rounded-sm p-5">
              <p className="text-xs uppercase tracking-widest text-[#7A7A7A] mb-3">By type</p>
              <div className="space-y-1.5">
                {stats.by_type.slice(0, 8).map(([t, n]) => (
                  <div key={t} className="flex items-center gap-2 text-sm">
                    <span className="w-40 truncate">{t}</span>
                    <div className="flex-1 h-2 bg-[#F7F2EA] rounded-full"><div className="h-full bg-[#D94A2B] rounded-full" style={{ width: `${(n / stats.total) * 100}%` }} /></div>
                    <span className="w-6 text-right text-[#7A7A7A]">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <h2 className="font-display text-2xl font-semibold mb-4">All opportunities</h2>
      <div className="bg-white border border-[#D8CFC2] rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-[#D8CFC2] text-left text-xs uppercase tracking-widest text-[#7A7A7A]">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {opps.map((o) => (
              <tr key={o.id} data-testid={`admin-row-${o.id}`} className="border-b border-[#D8CFC2]/60 hover:bg-[#F7F2EA]/50">
                <td className="px-4 py-3">
                  <Link to={`/opportunities/${o.id}`} className="font-medium hover:text-[#D94A2B]">{o.title}</Link>
                  <p className="text-xs text-[#7A7A7A]">{o.organisation}</p>
                </td>
                <td className="px-4 py-3">{o.opportunity_type}</td>
                <td className="px-4 py-3">{o.deadline}</td>
                <td className={`px-4 py-3 capitalize ${STATUS_COLORS[o.status] || ""}`}>{o.status}</td>
                <td className="px-4 py-3">{o.verified ? <BadgeCheck size={16} className="text-[#4F6F52]" /> : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 text-[#7A7A7A]">
                    <Link data-testid={`edit-${o.id}`} to={`/admin/opportunities/${o.id}/edit`} title="Edit" className="hover:text-[#1F1F1F]"><Pencil size={15} /></Link>
                    <button data-testid={`verify-${o.id}`} title={o.verified ? "Unverify" : "Mark verified"}
                      onClick={() => patch(o.id, { verified: !o.verified }, o.verified ? "Unverified" : "Marked as verified")}
                      className="hover:text-[#4F6F52]"><BadgeCheck size={15} /></button>
                    <button data-testid={`publish-${o.id}`} title={o.status === "published" ? "Unpublish" : "Publish"}
                      onClick={() => patch(o.id, { status: o.status === "published" ? "draft" : "published" }, o.status === "published" ? "Unpublished" : "Published")}
                      className="hover:text-[#1F1F1F]">{o.status === "published" ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    <button data-testid={`close-${o.id}`} title="Close" onClick={() => patch(o.id, { status: "closed" }, "Closed")} className="hover:text-[#D94A2B]"><XCircle size={15} /></button>
                    <button data-testid={`archive-${o.id}`} title="Archive" onClick={() => patch(o.id, { status: "archived" }, "Archived")} className="hover:text-[#1F1F1F]"><Archive size={15} /></button>
                    <button data-testid={`delete-${o.id}`} title="Delete" onClick={() => remove(o.id)} className="hover:text-[#D94A2B]"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
