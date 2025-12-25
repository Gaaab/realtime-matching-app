export const useMedia = () => {
  const api = useApi()

  const uploadMedia = async (file: File, metadata?: Record<string, any>) => {
    try {
      const response = await api.uploadFile('/media', file, metadata)

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to upload media')
    } catch (error: any) {
      console.error('Upload media error:', error)
      throw error
    }
  }

  const deleteMedia = async (mediaId: number) => {
    try {
      const response = await api.delete(`/media/${mediaId}`)

      if (response.success) {
        return true
      }

      throw new Error(response.message || 'Failed to delete media')
    } catch (error: any) {
      console.error('Delete media error:', error)
      throw error
    }
  }

  const getSignedUploadUrl = async (fileName: string, fileType: string) => {
    try {
      const response = await api.post<{ url: string; key: string }>('/s3-upload-signed-url', {
        file_name: fileName,
        file_type: fileType,
      })

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to get signed upload URL')
    } catch (error: any) {
      console.error('Get signed upload URL error:', error)
      throw error
    }
  }

  const uploadToS3 = async (file: File, signedUrl: string) => {
    try {
      const response = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to upload to S3')
      }

      return true
    } catch (error: any) {
      console.error('Upload to S3 error:', error)
      throw error
    }
  }

  const uploadWithSignedUrl = async (file: File) => {
    try {
      // Get signed URL
      const { url, key } = await getSignedUploadUrl(file.name, file.type)

      // Upload to S3
      await uploadToS3(file, url)

      // Return the key/URL
      return key
    } catch (error: any) {
      console.error('Upload with signed URL error:', error)
      throw error
    }
  }

  const validateImageFile = (file: File, maxSizeMB: number = 10) => {
    const errors: string[] = []

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      errors.push('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      errors.push(`File size must be less than ${maxSizeMB}MB`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const loading = ref(false)
  const uploadProgress = ref(0)

  return {
    uploadMedia,
    deleteMedia,
    getSignedUploadUrl,
    uploadToS3,
    uploadWithSignedUrl,
    validateImageFile,
    loading,
    uploadProgress,
  }
}
