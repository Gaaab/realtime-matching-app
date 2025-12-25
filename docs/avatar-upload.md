# Avatar Upload System

This documentation explains how to use the avatar upload system with image cropping functionality.

## Overview

The avatar upload system consists of several components working together:

1. **useUploadAvatar** - Composable that handles the upload logic
2. **UiAvatarUploader** - Component with cropping UI
3. **heic2any Plugin** - Converts HEIC/HEIF images to JPEG
4. **Image Utilities** - Helper functions for validation and processing

## Installation

The required dependencies are already installed:
- `vue-advanced-cropper` - Image cropping library
- `heic2any` - HEIC/HEIF to JPEG conversion

## Usage

### Basic Example

```vue
<script setup lang="ts">
import { useUploadAvatar } from '~/composables/useUploadAvatar'
import type { FileUpload } from '~/composables/useUploadAvatar'

const { user } = useAuth()
const { handleUpload, loading, error } = useUploadAvatar()

const uploaderError = ref<string>('')
const avatarUrl = computed(() => user.value?.profile?.profile_picture_url)

const onSave = async (data: FileUpload & { canvas: HTMLCanvasElement }) => {
  try {
    await handleUpload(data)
    // Avatar uploaded successfully
  } catch (err: any) {
    uploaderError.value = err.message
  }
}
</script>

<template>
  <UiAvatarUploader
    :src="avatarUrl"
    :loading="loading"
    :error-messages="uploaderError"
    size="lg"
    @save="onSave"
    @error="(msg) => uploaderError = msg"
  />
</template>
```

### Component Props

**UiAvatarUploader**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | Current avatar URL |
| `alt` | `string` | - | Alt text for the image |
| `loading` | `boolean` | `false` | Loading state during upload |
| `errorMessages` | `string \| string[]` | - | Error messages to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'lg'` | Size of the avatar |

### Component Events

| Event | Payload | Description |
|-------|---------|-------------|
| `save` | `FileUpload & { canvas: HTMLCanvasElement }` | Emitted when user clicks save |
| `added` | - | Emitted when image is selected |
| `removed` | - | Emitted when image is removed |
| `error` | `string` | Emitted on error |

### Composable

**useUploadAvatar()**

Returns:
- `handleUpload(data)` - Function to upload the cropped avatar
- `loading` - Reactive loading state
- `error` - Reactive error state

## Features

### Image Cropping
- Users can crop their images before uploading
- Maintains 1:1 aspect ratio for avatars
- Real-time preview

### HEIC/HEIF Support
- Automatically converts Apple's HEIC/HEIF format to JPEG
- Maintains quality during conversion

### Validation
- File type validation (JPEG, PNG, GIF, WebP, HEIC)
- File size validation (max 10MB by default)
- Image dimension validation

### Error Handling
- User-friendly error messages
- Automatic error clearing
- Loading states during upload

## API Endpoints

The system uses a two-step upload process:

1. `POST /media` - Upload file to get `media_id`
2. `POST /auth/profile/avatar/attachMedia` - Attach media to profile with `{ media_id }`

This follows the same pattern as the reference project for consistency.

## Image Utilities

Available utility functions from `~/utils/image`:

```typescript
// Validate image file
validateImageFile(file: File, maxSizeMb?: number): string | null

// Parse image to base64
parseImage(file: File): Promise<string | null>

// Check if file is HEIC/HEIF
isHeicFile(file: File): boolean

// Check if file is valid image
isImageFile(file: File): boolean

// Get image dimensions
getImageDimensions(file: File): Promise<{ width: number; height: number }>
```

## Demo

Visit `/avatar-demo` to see a working example of the avatar upload system.

## Integration with Onboarding

To integrate with the onboarding flow, replace the simple file input with:

```vue
<UiAvatarUploader
  :src="user?.profile?.profile_picture_url"
  :loading="loading"
  :error-messages="errors.photo"
  @save="handleAvatarSave"
/>
```

Then handle the save event:

```typescript
const handleAvatarSave = async (data: FileUpload & { canvas: HTMLCanvasElement }) => {
  const { handleUpload } = useUploadAvatar()
  try {
    await handleUpload(data)
    // Continue to next step
  } catch (error) {
    // Handle error
  }
}
```
