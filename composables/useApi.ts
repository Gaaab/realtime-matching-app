import type { ApiResponse, ApiError } from '~/types/api'

interface FetchOptions extends RequestInit {
  params?: Record<string, any>
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  const getAuthToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  const setAuthToken = (token: string) => {
    if (process.client) {
      localStorage.setItem('auth_token', token)
    }
  }

  const removeAuthToken = () => {
    if (process.client) {
      localStorage.removeItem('auth_token')
    }
  }

  const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
    const url = new URL(`${baseURL}${endpoint}`)
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }
    return url.toString()
  }

  const getHeaders = (includeAuth: boolean = true): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (includeAuth) {
      const token = getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
    const contentType = response.headers.get('content-type')

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format')
    }

    const data = await response.json()

    if (!response.ok) {
      const error: ApiError = {
        success: false,
        http_status: response.status,
        message: data.message || 'An error occurred',
        errors: data.errors,
      }
      throw error
    }

    return data as ApiResponse<T>
  }

  const request = async <T>(
    endpoint: string,
    options: FetchOptions = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> => {
    try {
      const { params, ...fetchOptions } = options
      const url = buildUrl(endpoint, params)

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...getHeaders(includeAuth),
          ...fetchOptions.headers,
        },
      })

      return await handleResponse<T>(response)
    } catch (error) {
      if (error && typeof error === 'object' && 'http_status' in error) {
        throw error
      }
      throw {
        success: false,
        http_status: 0,
        message: error instanceof Error ? error.message : 'Network error occurred',
      } as ApiError
    }
  }

  const get = <T>(endpoint: string, params?: Record<string, any>, includeAuth: boolean = true) => {
    return request<T>(endpoint, { method: 'GET', params }, includeAuth)
  }

  const post = <T>(endpoint: string, body?: any, includeAuth: boolean = true) => {
    return request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    )
  }

  const put = <T>(endpoint: string, body?: any, includeAuth: boolean = true) => {
    return request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    )
  }

  const patch = <T>(endpoint: string, body?: any, includeAuth: boolean = true) => {
    return request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    )
  }

  const del = <T>(endpoint: string, includeAuth: boolean = true) => {
    return request<T>(endpoint, { method: 'DELETE' }, includeAuth)
  }

  const uploadFile = async <T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, String(additionalData[key]))
      })
    }

    try {
      const token = getAuthToken()
      const headers: HeadersInit = {
        'Accept': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      return await handleResponse<T>(response)
    } catch (error) {
      if (error && typeof error === 'object' && 'http_status' in error) {
        throw error
      }
      throw {
        success: false,
        http_status: 0,
        message: error instanceof Error ? error.message : 'Upload failed',
      } as ApiError
    }
  }

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    uploadFile,
    setAuthToken,
    removeAuthToken,
    getAuthToken,
  }
}
