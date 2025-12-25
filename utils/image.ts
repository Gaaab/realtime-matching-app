/**
 * Image utility functions for file validation and processing
 */

const VALID_IMAGE_TYPES = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic', 'heif']

/**
 * Convert file size to MB
 */
export function toMb(size: number): number {
  return size ? size / 1024 / 1024 : 0
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  const type = getImageFileType(file)[0]
  return type === 'image'
}

/**
 * Check if image type is valid
 */
export function isImageValidType(file: File): boolean {
  const type = getImageFileType(file)[1] as string
  return VALID_IMAGE_TYPES.includes(type.toLowerCase())
}

/**
 * Get image file type parts [type, subtype]
 */
export function getImageFileType(file: File): string[] {
  return file.type.split('/')
}

/**
 * Check if file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  return ['heic', 'heif'].includes(extension) ||
         ['heic', 'heif', 'heif-sequence', 'heic-sequence'].includes(getImageFileType(file)[1] as string)
}

/**
 * Convert image file to base64 data URL
 */
export function parseImage(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * Returns error message if invalid, null if valid
 */
export function validateImageFile(file: File, maxSizeMb: number = 10): string | null {
  if (!file) {
    return 'No file selected'
  }

  if (!isImageFile(file)) {
    return 'File must be an image'
  }

  if (!isImageValidType(file)) {
    return `Invalid image type. Supported formats: ${VALID_IMAGE_TYPES.join(', ')}`
  }

  const sizeMb = toMb(file.size)
  if (sizeMb > maxSizeMb) {
    return `Image size must be less than ${maxSizeMb}MB (current: ${sizeMb.toFixed(2)}MB)`
  }

  return null
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
