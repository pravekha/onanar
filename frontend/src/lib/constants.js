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
  if (opp.deadline_state === "closed") return { label: "Closed", cls: "bg-ink text-butter" };
  if (opp.deadline_state === "rolling") return { label: "Recurring", cls: "bg-lilac text-ink" };
  if (opp.deadline_state === "closing_soon") return { label: `${opp.days_left} day${opp.days_left === 1 ? "" : "s"} left`, cls: "bg-flame text-white" };
  if (opp.deadline_state === "closing_month") return { label: `${opp.days_left} days left`, cls: "bg-butter text-ink" };
  return { label: "Open", cls: "bg-butter text-ink" };
}
