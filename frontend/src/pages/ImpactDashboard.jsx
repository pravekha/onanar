import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../lib/api";
import { toast } from "sonner";

const input = "w-full bg-white rounded-full px-4 py-2.5 text-sm border border-lilac/40 focus:border-ink focus:outline-none";
const label = "text-[10px] uppercase tracking-[0.25em] text-ink/60 font-semibold block mb-1.5 ml-4";

// Bento color palette for stat tiles
const HL_STYLES = [
  { bg: "bg-flame", txt: "text-ink", sub: "text-ink/70" },      // hours saved
  { bg: "bg-ink",   txt: "text-butter", sub: "text-lilac" },    // pct reduction
  { bg: "bg-lilac", txt: "text-ink", sub: "text-ink/70" },
  { bg: "bg-butter",txt: "text-ink", sub: "text-ink/70" },
  { bg: "bg-white", txt: "text-ink", sub: "text-ink/60" },
  { bg: "bg-white", txt: "text-ink", sub: "text-ink/60" },
];

export default function ImpactDashboard() {
  const [m, setM] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/admin/impact").then((r) => setM(r.data)); }, []);

  if (!m) return <p className="text-center text-sm text-ink/60 py-20">Loading…</p>;

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
    { name: "Before Onanar", hours: Number(m.hours_before) || 0, fill: "#BCACCE" },
    { name: "After Onanar", hours: Number(m.hours_after) || 0, fill: "#F94500" },
  ];

  const highlight = [
    { label: "Hours saved / week", value: m.time_saved_per_week, testId: "impact-time-saved" },
    { label: "Reduction in search time", value: `${m.pct_reduction}%`, testId: "impact-pct-reduction" },
    { label: "Opportunities centralised", value: m.opportunities_added, testId: "impact-opps-centralised" },
    { label: "Applications tracked", value: m.applications_tracked, testId: "impact-apps-tracked" },
    { label: "Users supported", value: Number(m.users_supported) || m.registered_artists, testId: "impact-users" },
    { label: "Digests generated", value: m.digests_generated, testId: "impact-digests" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 bg-paper">
      {/* Header bento */}
      <div className="grid grid-cols-12 gap-5 mb-6">
        <div className="col-span-12 bg-white rounded-3xl p-8 bento">
          <p className="section-num mb-3">03 / Impact</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink">
            Before Onanar. <span className="marker-butter">After Onanar.</span>
          </h1>
          <p className="mt-4 text-sm text-ink/70">Before/after metrics for the demo narrative — how Onanar centralises scattered discovery.</p>
        </div>
      </div>

      {/* Stat bento — asymmetric */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        {highlight.map((c, i) => {
          const style = HL_STYLES[i];
          // First two are "hero" tiles — larger
          const span = i < 2 ? "col-span-12 sm:col-span-6 lg:col-span-6" : "col-span-6 lg:col-span-3";
          return (
            <div key={c.label} data-testid={c.testId} className={`${span} ${style.bg} rounded-3xl p-6 bento bento-hover flex flex-col justify-between min-h-[150px]`}>
              <p className={`text-[10px] uppercase tracking-[0.25em] font-semibold ${style.sub}`}>{c.label}</p>
              <p className={`font-display leading-none ${style.txt} ${i < 2 ? "text-7xl md:text-8xl" : "text-5xl"}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Metrics form */}
        <form onSubmit={save} className="col-span-12 lg:col-span-6 bg-white rounded-3xl p-8 bento space-y-5">
          <p className="section-num">Enter metrics</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>Before (hrs/wk)</label><input data-testid="impact-hours-before" type="number" min="0" step="0.5" value={m.hours_before} onChange={set("hours_before")} className={input} /></div>
            <div><label className={label}>After (hrs/wk)</label><input data-testid="impact-hours-after" type="number" min="0" step="0.5" value={m.hours_after} onChange={set("hours_after")} className={input} /></div>
            <div><label className={label}>Discovered</label><input data-testid="impact-discovered" type="number" min="0" value={m.opportunities_discovered} onChange={set("opportunities_discovered")} className={input} /></div>
            <div><label className={label}>Users supported</label><input data-testid="impact-users-input" type="number" min="0" value={m.users_supported} onChange={set("users_supported")} className={input} /></div>
            <div><label className={label}>Deadlines saved</label><input data-testid="impact-deadlines" type="number" min="0" value={m.deadlines_saved} onChange={set("deadlines_saved")} className={input} /></div>
          </div>
          <p className="text-xs text-ink/60 border-t border-lilac/40 pt-4">
            Auto-tracked: {m.opportunities_added} added · {m.applications_tracked} applications · {m.registered_artists} artists · {m.digests_generated} digests.
          </p>
          <button data-testid="impact-save-button" disabled={busy} type="submit"
            className="bg-flame text-white px-10 py-3 rounded-full text-sm font-semibold hover:bg-ink hover:text-butter transition-all disabled:opacity-60">
            {busy ? "Saving…" : "Save metrics"}
          </button>
        </form>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-6 bg-lilac rounded-3xl p-8 bento">
          <p className="section-num mb-2" style={{ color: "#23003F" }}>Weekly search time</p>
          <h3 className="font-display text-3xl text-ink mb-6">Hours per week</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#23003F" }} stroke="#23003F" />
              <YAxis tick={{ fontSize: 12, fill: "#23003F" }} stroke="#23003F" />
              <Tooltip cursor={{ fill: "rgba(35,0,63,0.05)" }} contentStyle={{ borderRadius: 12, border: "1px solid #BCACCE" }} />
              <Bar dataKey="hours" radius={[12, 12, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-ink/70 mt-3">Before Onanar, discovery was scattered across Instagram, WhatsApp, PDFs and closed networks. After: one desk.</p>
        </div>
      </div>
    </main>
  );
}
