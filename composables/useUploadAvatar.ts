/**
 * Composable for handling avatar upload with cropping
 * Follows the two-step pattern:
 * 1. Upload file to media endpoint → get media_id
 * 2. Attach media to profile via /auth/profile/avatar/attachMedia
 */
export interface FileUpload {
  file: File | null
  base64: string | ArrayBuffer | null
}

export const useUploadAvatar = () => {
  const api = useApi()
  const { uploadMedia } = useMediaUpload()
  const { fetchProfile } = useAuth()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Handle avatar upload from cropped canvas
   * @param data - Object containing file info and cropped canvas
   */
  const handleUpload = async (data: FileUpload & { canvas: HTMLCanvasElement }) => {
    if (!data.file || !data.canvas) {
      error.value = 'No file or canvas provided'
      return
    }

    loading.value = true
    error.value = null

    try {
      // Convert canvas to blob and create File
      const blob = await new Promise<Blob | null>((resolve) => {
        data.canvas.toBlob(resolve, data.file?.type || 'image/jpeg', 0.9)
      })

      if (!blob) {
        throw new Error('Failed to create image blob')
      }

      // Create File from blob, preserving original file metadata
      const file = new File([blob], data.file.name, {
        type: data.file.type || 'image/jpeg',
        lastModified: data.file.lastModified,
      })

      // Step 1: Upload file to get media_id
      const mediaId = await uploadMedia(file)

      if (!mediaId) {
        throw new Error('Failed to upload media')
      }

      // Step 2: Attach media to profile
      const response = await api.post('/auth/profile/avatar/attachMedia', {
        media_id: mediaId,
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to attach avatar')
      }

      // Refresh profile to get updated avatar URL
      await fetchProfile()
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      error.value = err.message || 'Failed to upload avatar'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    handleUpload,
    loading,
    error,
  }
}
