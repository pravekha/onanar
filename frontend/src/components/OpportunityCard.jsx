import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, MapPin, BadgeCheck } from "lucide-react";
import { deadlineBadge } from "../lib/constants";

export default function OpportunityCard({ opp, saved, onToggleSave }) {
  const badge = deadlineBadge(opp);
  const closed = opp.deadline_state === "closed";
  return (
    <article data-testid={`opportunity-card-${opp.id}`}
      className={`bg-white border border-[#D8CFC2] rounded-sm p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5 ${closed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-widest text-[#D94A2B] font-medium">{opp.opportunity_type}</span>
          {opp.verified && (
            <span data-testid="verified-badge" className="inline-flex items-center gap-1 text-xs text-[#4F6F52]">
              <BadgeCheck size={13} /> Verified
            </span>
          )}
        </div>
        {onToggleSave && (
          <button data-testid={`save-button-${opp.id}`} onClick={(e) => { e.preventDefault(); onToggleSave(opp); }}
            className="text-[#1F1F1F] hover:text-[#D94A2B] transition-colors" title={saved ? "Unsave" : "Save"}>
            {saved ? <BookmarkCheck size={19} className="text-[#D94A2B]" /> : <Bookmark size={19} />}
          </button>
        )}
      </div>
      <Link to={`/opportunities/${opp.id}`} className="group">
        <h3 className="font-display text-2xl font-semibold leading-tight group-hover:text-[#D94A2B] transition-colors">{opp.title}</h3>
        <p className="text-sm text-[#7A7A7A] mt-0.5">{opp.organisation}</p>
      </Link>
      <p className="text-sm leading-relaxed text-[#1F1F1F]/80 line-clamp-2">{opp.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {(opp.disciplines || []).slice(0, 3).map((d) => (
          <span key={d} className="text-xs border border-[#D8CFC2] px-2 py-0.5 rounded-sm text-[#1F1F1F]/70">{d}</span>
        ))}
      </div>
      <div className="mt-auto pt-3 border-t border-[#D8CFC2] flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1 text-[#7A7A7A]"><MapPin size={13} /> {opp.location}</span>
        <span className="font-medium">{opp.funding_amount}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span data-testid="deadline-badge" className={`text-xs px-2.5 py-1 rounded-sm ${badge.cls}`}>{badge.label}</span>
        <span className="text-xs text-[#7A7A7A]">Difficulty: {opp.difficulty}</span>
      </div>
      {typeof opp.match_score === "number" && (
        <div data-testid="match-score" className="border-t border-dashed border-[#D8CFC2] pt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-[#D94A2B]">{opp.match_score}% match</span>
          </div>
          <div className="h-1 bg-[#F7F2EA] rounded-full overflow-hidden">
            <div className="h-full bg-[#D94A2B]" style={{ width: `${opp.match_score}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}
