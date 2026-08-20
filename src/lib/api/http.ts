import { NextResponse } from "next/server";
import type { AppResponse } from "@/lib/response";

export function jsonResponse<T>(payload: AppResponse<T>, status = 200) {
  return NextResponse.json(payload, { status });
}
