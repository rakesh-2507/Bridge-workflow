import { apiRequest } from "./client";

/* =========================================================
 * Dashboard Metrics Types
 * ========================================================= */

export interface DashboardMetrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface DashboardActiveWorkflow {
  label: string;
  assign_to: string;
}

export interface DashboardProgress {
  completed_levels: number;
  total_levels: number;
  percentage: number;
}

export interface RecentDashboardRequest {
  task_id: string;
  config_name: string;
  config_type: string;
  mapping_type: string;
  mapping_value: string;
  status: string;
  active: DashboardActiveWorkflow | null;
  progress: DashboardProgress;
}

export interface DashboardData {
  user_id: number;
  metrics: DashboardMetrics;
  recent_requests: RecentDashboardRequest[];
}

export interface DashboardMetricsResponse {
  success: boolean;
  code: string;
  message: string;
  data: DashboardData;
}

/* =========================================================
 * Get Dashboard Metrics
 * ========================================================= */

export async function getDashboardMetrics(): Promise<DashboardData> {
  const response = await apiRequest<DashboardMetricsResponse>(
    "/api/dashboard/metrics",
    {
      method: "GET",
    }
  );

  return response.data;
}