import type { Match } from "@/features/matches/types";

export function selectNextMatch(matches: Match[], now = Date.now()) {
  return matches
    .filter(
      (match) =>
        match.status === "scheduled" &&
        new Date(`${match.date}T${match.time}:00+07:00`).getTime() >= now,
    )
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
}
