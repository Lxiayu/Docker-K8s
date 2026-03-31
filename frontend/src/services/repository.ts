import request, { PageData } from '../utils/request'

export interface Repository {
  id: number
  name: string
  url: string
  type: 'gitlab' | 'github' | 'gitee'
  branch: string
  webhook_url: string
  status: number
  created_at: string
  updated_at: string
}

export const repositoryApi = {
  list: (params: { page?: number; page_size?: number }): Promise<PageData<Repository>> =>
    request.get('/repositories', { params }),
  
  get: (id: number): Promise<Repository> =>
    request.get(`/repositories/${id}`),
  
  create: (params: Partial<Repository>): Promise<Repository> =>
    request.post('/repositories', params),
  
  update: (id: number, params: Partial<Repository>): Promise<Repository> =>
    request.put(`/repositories/${id}`, params),
  
  delete: (id: number): Promise<void> =>
    request.delete(`/repositories/${id}`),
  
  test: (id: number): Promise<{ status: string }> =>
    request.post(`/repositories/${id}/test`),
}
