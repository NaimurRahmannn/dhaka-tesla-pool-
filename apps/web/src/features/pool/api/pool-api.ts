import { apiClient } from "@/lib/api-client";
import type { Pool } from "../types/pool.types";

export function getDriverPools(): Promise<Pool[]> {
  return apiClient.get<Pool[]>("/driver/pools");
}

export function getAssignedPools(): Promise<Pool[]> {
  return getDriverPools();
}
