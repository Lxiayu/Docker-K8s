import request, { PageData } from '../utils/request'

export interface Deployment {
  id: number
  name: string
  namespace: string
  image: string
  replicas: number
  strategy: 'rolling' | 'canary' | 'blue-green'
  status: string
  environment: 'dev' | 'test' | 'prod'
  config: string
  created_at: string
  updated_at: string
}

export interface PodInfo {
  name: string
  namespace: string
  status: string
  ready: string
  cpu: string
  memory: string
  restarts: number
  age: string
  ip: string
  labels: Record<string, string>
}

export interface EventInfo {
  type: string
  reason: string
  message: string
  count: number
  age: string
  last_seen: string
  object: string
  namespace: string
}

export const deploymentApi = {
  list: (params: { page?: number; page_size?: number; environment?: string }): Promise<PageData<Deployment>> =>
    request.get('/deployments', { params }),
  
  get: (id: number): Promise<Deployment> =>
    request.get(`/deployments/${id}`),
  
  create: (params: Partial<Deployment>): Promise<Deployment> =>
    request.post('/deployments', params),
  
  update: (id: number, params: Partial<Deployment>): Promise<Deployment> =>
    request.put(`/deployments/${id}`, params),
  
  delete: (id: number): Promise<void> =>
    request.delete(`/deployments/${id}`),
  
  deploy: (id: number): Promise<{ status: string }> =>
    request.post(`/deployments/${id}/deploy`),
  
  rollback: (id: number, params: { target_version?: string }): Promise<{ status: string }> =>
    request.post(`/deployments/${id}/rollback`, params),
  
  logs: (id: number): Promise<{ logs: string }> =>
    request.get(`/deployments/${id}/logs`),
  
  pods: (id: number): Promise<PodInfo[]> =>
    request.get(`/deployments/${id}/pods`),
  
  events: (id: number): Promise<EventInfo[]> =>
    request.get(`/deployments/${id}/events`),
  
  podLogs: (id: number, params: { pod: string; container?: string; tail_lines?: number }): Promise<{ logs: string }> =>
    request.get(`/deployments/${id}/pod-logs`, { params }),
  
  podContainers: (id: number, pod: string): Promise<string[]> =>
    request.get(`/deployments/${id}/pod-containers`, { params: { pod } }),
}
