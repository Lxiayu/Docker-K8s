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
  testRegistry: (): Promise<{ status: string; message: string }> => request.post('/settings/test/registry'),
  testNotification: (type: 'email' | 'dingtalk' | 'wechat'): Promise<{ status: string; message: string }> => request.post(`/settings/test/notification/${type}`),
}
