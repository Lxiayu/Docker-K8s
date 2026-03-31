import request from '../utils/request'

export interface BuildTrendItem {
  name: string
  success: number
  failed: number
  [key: string]: string | number
}

export interface DeployDistributionItem {
  name: string
  value: number
  color: string
}

export interface ResourceUsageItem {
  name: string
  usage: number
}

export interface RecentPipeline {
  id: number
  name: string
  status: string
  duration: string
  time: string
}

export interface DashboardStats {
  total_builds: number
  builds_trend: number
  total_deployments: number
  deployments_trend: number
  success_rate: number
  success_rate_trend: number
  active_users: number
  active_users_trend: number
  build_trend: BuildTrendItem[]
  deploy_distribution: DeployDistributionItem[]
  resource_usage: ResourceUsageItem[]
  recent_pipelines: RecentPipeline[]
  pending_alerts: number
  running_tasks: number
  completed_today: number
}

export type TimeRange = '7d' | '30d' | '90d'

export const dashboardApi = {
  getStats: (range: TimeRange): Promise<DashboardStats> =>
    request.get('/dashboard/stats', { params: { range } }),
}
