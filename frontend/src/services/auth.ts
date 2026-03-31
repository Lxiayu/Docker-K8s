import request, { PageData } from '../utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  status: number
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  token: string
  user: User
  expire_at: string
}

export const authApi = {
  login: (params: LoginParams): Promise<LoginResponse> => 
    request.post('/auth/login', params),
  
  register: (params: RegisterParams): Promise<User> => 
    request.post('/auth/register', params),
}

export interface UpdateProfileParams {
  username?: string
  email?: string
}

export interface ChangePasswordParams {
  current_password: string
  new_password: string
}

export const profileApi = {
  get: (): Promise<User> => 
    request.get('/users/me'),
  
  update: (params: UpdateProfileParams): Promise<User> =>
    request.put('/users/me', params),
  
  changePassword: (params: ChangePasswordParams): Promise<{ message: string }> =>
    request.put('/users/me/password', params),
}

export const userApi = {
  list: (params: { page?: number; page_size?: number; username?: string }): Promise<PageData<User>> =>
    request.get('/users', { params }),
  
  get: (id: number): Promise<User> => 
    request.get(`/users/${id}`),
  
  create: (params: RegisterParams & { role?: string }): Promise<User> =>
    request.post('/users', params),
  
  update: (id: number, params: Partial<User>): Promise<User> =>
    request.put(`/users/${id}`, params),
  
  delete: (id: number): Promise<void> =>
    request.delete(`/users/${id}`),
}
