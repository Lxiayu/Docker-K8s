import request from '../utils/request'

export interface Metric {
  name: string
  value: string
  status: string
}

export interface Alert {
  id: number
  name: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  time: string
  acknowledged: boolean
}

export interface AlertRule {
  id: number
  name: string
  condition: string
  enabled: boolean
}

export interface AlertStats {
  total: number
  critical: number
  warning: number
  acknowledged: number
}

export interface MetricsResponse {
  metrics: Metric[]
  stats: AlertStats
}

export interface CreateAlertRuleParams {
  name: string
  query: string
  duration: string
  severity: string
  description: string
  enabled?: boolean
  condition?: string
}

export const monitoringApi = {
  getMetrics: (): Promise<MetricsResponse> =>
    request.get('/monitoring/metrics'),

  getAlerts: (params?: { severity?: string; search?: string }): Promise<Alert[]> =>
    request.get('/monitoring/alerts', { params }),

  getAlertRules: (): Promise<AlertRule[]> =>
    request.get('/monitoring/alerts/rules'),

  acknowledgeAlert: (id: number): Promise<void> =>
    request.post(`/monitoring/alerts/${id}/acknowledge`),

  createAlertRule: (params: CreateAlertRuleParams): Promise<AlertRule> =>
    request.post('/monitoring/alerts/rules', params),

  toggleAlertRule: (id: number, enabled: boolean): Promise<void> =>
    request.put(`/monitoring/alerts/rules/${id}`, { enabled }),

  updateAlertRule: (id: number, params: CreateAlertRuleParams): Promise<AlertRule> =>
    request.put(`/monitoring/alerts/rules/${id}`, params),
}
