import request, { PageData } from '../utils/request'

export interface Image {
  id: number
  name: string
  full_path: string
  project: string
  tags_count: number
  size: number
  vulnerabilities: VulnerabilitySummary
  scan_status: 'pending' | 'scanning' | 'completed' | 'failed'
  last_updated: string
  created_at: string
}

export interface ImageTag {
  name: string
  size: number
  digest: string
  created_at: string
  vulnerabilities: VulnerabilitySummary
}

export interface VulnerabilitySummary {
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export interface ImageDetail extends Image {
  tags: ImageTag[]
  author: string
  architecture: string
  os: string
  docker_version: string
}

export interface BuildImageParams {
  name: string
  dockerfile_path: string
  build_context: string
  tag: string
  repository_id?: number
}

export const imageApi = {
  list: (params: { 
    page?: number
    page_size?: number
    project?: string
    search?: string
  }): Promise<PageData<Image>> =>
    request.get('/images', { params }),
  
  get: (id: number): Promise<ImageDetail> =>
    request.get(`/images/${id}`),
  
  scan: (id: number): Promise<{ status: string }> =>
    request.get(`/images/${id}/scan`),
  
  build: (params: BuildImageParams): Promise<{ status: string; image_id: number }> =>
    request.post('/images', params),
  
  delete: (id: number): Promise<void> =>
    request.delete(`/images/${id}`),
}
