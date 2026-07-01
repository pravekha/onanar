export const DISCIPLINES = ["Visual Arts", "Film", "Music", "Design", "Writing", "Theatre", "Dance", "Photography", "Architecture", "Craft", "Folk/Traditional Arts", "Research", "Digital Art", "Cultural Heritage", "Multi-disciplinary"];

export const OPPORTUNITY_TYPES = ["Grant", "Scholarship", "Residency", "Fellowship", "Open Call", "Award", "Competition", "Commission", "Travel Grant", "Production Fund", "Mentorship Programme"];

export const CAREER_STAGES = ["Student", "Emerging", "Mid-career", "Established"];

export const SOURCE_TYPES = ["Government", "Foundation", "University", "Festival", "Gallery", "Museum", "NGO", "CSR", "Residency", "Private Organisation", "International Organisation"];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export const TRACK_STATUSES = ["interested", "preparing", "applied", "accepted", "rejected", "archived"];

export const STATUS_LABELS = {
  interested: "Interested", preparing: "Preparing", applied: "Applied",
  accepted: "Accepted", rejected: "Rejected", archived: "Archived",
};

export function deadlineBadge(opp) {
  if (opp.deadline_state === "closed") return { label: "Closed", cls: "bg-[#1F1F1F] text-white" };
  if (opp.deadline_state === "closing_soon") return { label: `Closing in ${opp.days_left} day${opp.days_left === 1 ? "" : "s"}`, cls: "bg-[#D94A2B] text-white" };
  if (opp.deadline_state === "closing_month") return { label: `${opp.days_left} days left`, cls: "bg-[#4F6F52] text-white" };
  return { label: "Open", cls: "border border-[#4F6F52] text-[#4F6F52]" };
}
