import { ok } from "@/lib/response";
import { mockMembers } from "@/lib/constants/mockData";

export async function getMembers() {
  return ok(mockMembers);
}

export async function getActiveMembers() {
  return ok(mockMembers.filter((member) => member.status === "active"));
}

export async function getMemberById(memberId: string) {
  return ok(mockMembers.find((member) => member.id === memberId));
}
