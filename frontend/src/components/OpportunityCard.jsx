import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, MapPin, BadgeCheck, ArrowUpRight } from "lucide-react";
import { deadlineBadge } from "../lib/constants";

// Bento color variants — rotates across the grid for variety
const VARIANTS = {
  white:  { bg: "bg-white",           text: "text-ink",    sub: "text-ink/60",    accent: "text-flame", border: "border border-lilac/40", pill: "bg-lilac text-ink", tag: "border border-ink/15 text-ink/70" },
  lilac:  { bg: "bg-lilac",           text: "text-ink",    sub: "text-ink/70",    accent: "text-ink",   border: "",                       pill: "bg-white text-ink", tag: "bg-white/60 text-ink/80" },
  butter: { bg: "bg-butter",          text: "text-ink",    sub: "text-ink/70",    accent: "text-flame", border: "",                       pill: "bg-ink text-butter", tag: "bg-white/60 text-ink/80" },
  ink:    { bg: "bg-ink",             text: "text-butter", sub: "text-lilac",     accent: "text-lilac", border: "",                       pill: "bg-flame text-white", tag: "bg-white/10 text-lilac" },
  flame:  { bg: "bg-flame",           text: "text-ink",    sub: "text-ink/70",    accent: "text-ink",   border: "",                       pill: "bg-ink text-butter",  tag: "bg-white/70 text-ink" },
};

export default function OpportunityCard({ opp, saved, onToggleSave, variant = "white", featured = false }) {
  const v = VARIANTS[variant] || VARIANTS.white;
  const badge = deadlineBadge(opp);
  const closed = opp.deadline_state === "closed";

  return (
    <article data-testid={`opportunity-card-${opp.id}`}
      className={`${v.bg} ${v.border} rounded-3xl p-6 flex flex-col gap-3 bento bento-hover ${closed ? "opacity-70" : ""} ${featured ? "min-h-[340px]" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest uppercase ${v.pill}`}>{opp.opportunity_type}</span>
          {opp.verified && (
            <span data-testid="verified-badge" className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest ${v.accent}`}>
              <BadgeCheck size={12} /> Verified
            </span>
          )}
        </div>
        {onToggleSave && (
          <button data-testid={`save-button-${opp.id}`} onClick={(e) => { e.preventDefault(); onToggleSave(opp); }}
            className={`${v.text} hover:scale-110 transition-transform`} title={saved ? "Unsave" : "Save"}>
            {saved ? <BookmarkCheck size={20} className={v.accent} /> : <Bookmark size={20} />}
          </button>
        )}
      </div>

      <Link to={`/opportunities/${opp.id}`} className="group flex-1">
        <h3 className={`font-display ${featured ? "text-3xl md:text-4xl" : "text-2xl"} leading-[1.05] ${v.text} group-hover:opacity-80 transition-opacity`}>
          {opp.title}
        </h3>
        <p className={`text-sm mt-1.5 ${v.sub}`}>{opp.organisation}</p>
        {featured && <p className={`text-sm mt-3 leading-relaxed line-clamp-3 ${v.text} opacity-90`}>{opp.summary}</p>}
      </Link>

      {!featured && (
        <p className={`text-sm leading-relaxed line-clamp-2 ${v.text} opacity-85`}>{opp.summary}</p>
      )}

      {(opp.disciplines || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {opp.disciplines.slice(0, 3).map((d) => (
            <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full ${v.tag}`}>{d}</span>
          ))}
        </div>
      )}

      <div className={`mt-auto pt-3 border-t ${variant === "ink" ? "border-white/10" : variant === "flame" ? "border-ink/15" : "border-ink/10"} flex flex-wrap items-center justify-between gap-2 text-sm`}>
        <span className={`inline-flex items-center gap-1 text-xs ${v.sub}`}><MapPin size={12} /> {opp.location}</span>
        <span className={`text-sm font-semibold ${v.text}`}>{opp.funding_amount}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span data-testid="deadline-badge" className={`text-[11px] font-medium px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
        <span className={`text-[10px] uppercase tracking-widest ${v.sub}`}>{opp.difficulty}</span>
      </div>

      {typeof opp.match_score === "number" && (
        <div data-testid="match-score" className={`pt-3 border-t border-dashed ${variant === "ink" ? "border-white/15" : "border-ink/10"}`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={`font-semibold ${v.accent}`}>{opp.match_score}% match</span>
            <ArrowUpRight size={13} className={v.accent} />
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${variant === "ink" ? "bg-white/15" : "bg-ink/10"}`}>
            <div className="h-full bg-flame rounded-full transition-all duration-500" style={{ width: `${opp.match_score}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}

// Helper: rotate colors across a list of cards for bento variety.
// Skips flame (too strong for many-card runs) and rotates: white, lilac, butter, white, ink, ...
const ROTATION = ["white", "lilac", "white", "butter", "white", "ink", "lilac", "butter"];
export function cardVariantAt(index) {
  return ROTATION[index % ROTATION.length];
}
