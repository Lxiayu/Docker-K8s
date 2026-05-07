import request, { PageData } from '../utils/request'

export interface Pipeline {
  id: number
  name: string
  repo_id: number
  config: string
  status: string
  last_build_at: string
  created_at: string
  updated_at: string
}

export interface Build {
  id: number
  pipeline_id: number
  commit_hash: string
  branch: string
  status: string
  log: string
  duration: number
  created_at: string
  updated_at: string
}

export const pipelineApi = {
  list: (params: { page?: number; page_size?: number }): Promise<PageData<Pipeline>> =>
    request.get('/pipelines', { params }),
  
  get: (id: number): Promise<Pipeline> =>
    request.get(`/pipelines/${id}`),
  
  create: (params: Partial<Pipeline>): Promise<Pipeline> =>
    request.post('/pipelines', params),
  
  update: (id: number, params: Partial<Pipeline>): Promise<Pipeline> =>
    request.put(`/pipelines/${id}`, params),
  
  delete: (id: number): Promise<void> =>
    request.delete(`/pipelines/${id}`),
  
  trigger: (id: number, params?: { branch?: string }): Promise<{ build_id: string; status: string }> =>
    request.post(`/pipelines/${id}/trigger`, params),
  
  listBuilds: (id: number, params: { page?: number; page_size?: number }): Promise<PageData<Build>> =>
    request.get(`/pipelines/${id}/builds`, { params }),
  
  getBuild: (pipelineId: number, buildId: number): Promise<Build> =>
    request.get(`/pipelines/${pipelineId}/builds/${buildId}`),
}
