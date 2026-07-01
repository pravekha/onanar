import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../lib/api";
import { toast } from "sonner";

const input = "w-full border border-[#D8CFC2] bg-white rounded-sm px-3 py-2 text-sm focus:border-[#1F1F1F]";
const label = "text-xs uppercase tracking-widest text-[#7A7A7A] block mb-1";

export default function ImpactDashboard() {
  const [m, setM] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/admin/impact").then((r) => setM(r.data)); }, []);

  if (!m) return <p className="text-center text-sm text-[#7A7A7A] py-20">Loading…</p>;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.put("/admin/impact", {
        hours_before: Number(m.hours_before), hours_after: Number(m.hours_after),
        opportunities_discovered: Number(m.opportunities_discovered),
        users_supported: Number(m.users_supported), deadlines_saved: Number(m.deadlines_saved),
      });
      setM(r.data);
      toast.success("Impact metrics saved");
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setM({ ...m, [k]: e.target.value });
  const chartData = [
    { name: "Before Onanar", hours: Number(m.hours_before) || 0 },
    { name: "After Onanar", hours: Number(m.hours_after) || 0 },
  ];

  const highlight = [
    { label: "Hours saved per week", value: m.time_saved_per_week, testId: "impact-time-saved", accent: true },
    { label: "Reduction in search time", value: `${m.pct_reduction}%`, testId: "impact-pct-reduction", accent: true },
    { label: "Opportunities centralised", value: m.opportunities_added, testId: "impact-opps-centralised" },
    { label: "Applications tracked", value: m.applications_tracked, testId: "impact-apps-tracked" },
    { label: "Users supported", value: Number(m.users_supported) || m.registered_artists, testId: "impact-users" },
    { label: "Digests generated", value: m.digests_generated, testId: "impact-digests" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-2">Impact Dashboard</h1>
      <p className="text-sm text-[#7A7A7A] mb-8">Before/after metrics for the demo narrative — how Onanar centralises scattered discovery.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {highlight.map((c) => (
          <div key={c.label} data-testid={c.testId} className={`border rounded-sm p-5 ${c.accent ? "bg-[#1F1F1F] text-[#F7F2EA] border-[#1F1F1F]" : "bg-white border-[#D8CFC2]"}`}>
            <p className={`font-display text-4xl font-semibold ${c.accent ? "text-[#D94A2B]" : "text-[#1F1F1F]"}`}>{c.value}</p>
            <p className={`text-xs uppercase tracking-widest mt-1 ${c.accent ? "text-[#F7F2EA]/60" : "text-[#7A7A7A]"}`}>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={save} className="bg-white border border-[#D8CFC2] rounded-sm p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Enter metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>Hours/week searching — before</label><input data-testid="impact-hours-before" type="number" min="0" step="0.5" value={m.hours_before} onChange={set("hours_before")} className={input} /></div>
            <div><label className={label}>Hours/week — after Onanar</label><input data-testid="impact-hours-after" type="number" min="0" step="0.5" value={m.hours_after} onChange={set("hours_after")} className={input} /></div>
            <div><label className={label}>Opportunities discovered</label><input data-testid="impact-discovered" type="number" min="0" value={m.opportunities_discovered} onChange={set("opportunities_discovered")} className={input} /></div>
            <div><label className={label}>Users supported</label><input data-testid="impact-users-input" type="number" min="0" value={m.users_supported} onChange={set("users_supported")} className={input} /></div>
            <div><label className={label}>Deadlines saved</label><input data-testid="impact-deadlines" type="number" min="0" value={m.deadlines_saved} onChange={set("deadlines_saved")} className={input} /></div>
          </div>
          <div className="text-xs text-[#7A7A7A] space-y-1 border-t border-[#D8CFC2] pt-3">
            <p>Auto-tracked: opportunities added ({m.opportunities_added}), applications tracked ({m.applications_tracked}), registered artists ({m.registered_artists}), digests generated ({m.digests_generated}).</p>
          </div>
          <button data-testid="impact-save-button" disabled={busy} type="submit"
            className="bg-[#D94A2B] text-white px-8 py-2.5 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors disabled:opacity-60">
            {busy ? "Saving…" : "Save metrics"}
          </button>
        </form>

        <div className="bg-white border border-[#D8CFC2] rounded-sm p-6">
          <h2 className="font-display text-2xl font-semibold mb-4">Weekly search time</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#7A7A7A" />
              <YAxis tick={{ fontSize: 12 }} stroke="#7A7A7A" />
              <Tooltip cursor={{ fill: "#F7F2EA" }} />
              <Bar dataKey="hours" fill="#D94A2B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-[#7A7A7A] mt-2">Before Onanar, discovery was scattered across Instagram, WhatsApp, PDFs and closed networks. After: one desk.</p>
        </div>
      </div>
    </main>
  );
}
