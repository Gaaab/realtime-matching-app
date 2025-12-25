/**
 * Composable for uploading media files to the API
 * Uploads to POST /media endpoint and returns media_id
 */
export const useMediaUpload = () => {
  const api = useApi()

  /**
   * Upload a file and return the media_id
   * @param file - The file to upload
   * @returns Promise<number> - The media_id from the API
   */
  const uploadMedia = async (file: File): Promise<number> => {
    try {
      const response = await api.uploadFile<{ id: number }>('/media', file)

      if (response.success && response.data?.id) {
        return response.data.id
      }

      throw new Error('Failed to upload file')
    } catch (error: any) {
      console.error('Media upload error:', error)
      throw new Error(error.message || 'Failed to upload file')
    }
  }

  /**
   * Upload avatar directly to profile endpoint
   * @param file - The avatar file to upload
   * @returns Promise<ApiResponse> - The API response
   */
  const uploadAvatar = async (file: File) => {
    try {
      const response = await api.uploadFile('/auth/profile/avatar', file)
      return response
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      throw new Error(error.message || 'Failed to upload avatar')
    }
  }

  return {
    uploadMedia,
    uploadAvatar,
  }
}
