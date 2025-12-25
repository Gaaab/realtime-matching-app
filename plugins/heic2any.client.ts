/**
 * Plugin for converting HEIC/HEIF images to JPEG
 * Uses heic2any library to handle Apple's HEIC format
 */
import heic2any from 'heic2any'

export default defineNuxtPlugin(() => {
  /**
   * Convert HEIC/HEIF file to JPEG
   * @param file - The HEIC/HEIF file to convert
   * @returns Object with converted File and blob
   */
  const convertHeicToJpeg = async (file: File) => {
    try {
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      })

      // heic2any can return Blob or Blob[]
      const resultBlob = Array.isArray(blob) ? blob[0] : blob

      // Create a new File from the blob
      const convertedFile = new File(
        [resultBlob],
        file.name.replace(/\.(heic|heif)$/i, '.jpg'),
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      )

      return {
        file: convertedFile,
        blob: resultBlob,
      }
    } catch (error) {
      console.error('HEIC conversion error:', error)
      throw new Error('Failed to convert HEIC image')
    }
  }

  return {
    provide: {
      heicToJpeg: convertHeicToJpeg,
    },
  }
})
