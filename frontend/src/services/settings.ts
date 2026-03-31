import request from '../utils/request'

export interface Setting {
  id: number
  key: string
  value: string
  category: string
  description: string
}

export const settingsApi = {
  getAll: (): Promise<Setting[]> => request.get('/settings'),
  getByCategory: (category: string): Promise<Setting[]> => request.get(`/settings/${category}`),
  update: (settings: Record<string, string>): Promise<{ message: string }> => request.put('/settings', settings),
}
