import { redirect } from "next/navigation";
import { getNextMatch } from "@/features/matches/services/matchService";

export default async function LineupIndexPage() {
  const match = (await getNextMatch()).data;
  redirect(match ? `/lineup/${match.id}` : "/matches");
}
