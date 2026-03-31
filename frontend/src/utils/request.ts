import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth'

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

interface PageData<T = unknown> {
  list: T[]
  total: number
  page: number
  page_size: number
}

const axiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          toast.error('未授权，请重新登录')
          useAuthStore.getState().logout()
          window.location.href = '/login'
          break
        case 403:
          toast.error('没有权限访问')
          break
        case 404:
          toast.error('请求的资源不存在')
          break
        case 500:
          toast.error('服务器错误')
          break
        default:
          toast.error(error.response.data?.message || '请求失败')
      }
    } else {
      toast.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

async function handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): Promise<T> {
  const { data } = response
  if (data.code === 200) {
    return data.data
  } else {
    toast.error(data.message || '请求失败')
    throw new Error(data.message || '请求失败')
  }
}

const request = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.get<ApiResponse<T>>(url, config)
    return handleResponse<T>(response)
  },
  
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data, config)
    return handleResponse<T>(response)
  },
  
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, config)
    return handleResponse<T>(response)
  },
  
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, config)
    return handleResponse<T>(response)
  },
  
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data, config)
    return handleResponse<T>(response)
  },
}

export type { PageData }
export default request
