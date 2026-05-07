import request from '@/utils/request'

export interface AuditLog {
  id: number
  user_id: number
  username: string
  action: string
  resource_type: string
  resource_id: string
  details: string
  ip_address: string
  created_at: string
}

export interface AuditLogListResponse {
  data: AuditLog[]
  total: number
  page: number
  page_size: number
}

export const auditService = {
  getAuditLogs: (params?: { page?: number; page_size?: number; action?: string; user_id?: number }): Promise<AuditLogListResponse> => {
    return request.get('/audit/logs', { params })
  },
}
