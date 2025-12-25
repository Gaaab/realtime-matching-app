/**
 * Composable for managing chat accessibility features
 * Handles announcements, keyboard navigation, and focus management
 */
export const useChatAccessibility = () => {
  // Live region for screen reader announcements
  const announcements = ref<string[]>([])
  let announcementTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Announce a message to screen readers using an aria-live region
   */
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Add to announcements queue
    announcements.value.push(message)

    // Clear old announcements after a delay
    if (announcementTimeout) clearTimeout(announcementTimeout)
    announcementTimeout = setTimeout(() => {
      announcements.value = []
    }, 1000)
  }

  /**
   * Announce new message received
   */
  const announceNewMessage = (senderName: string, preview: string) => {
    const truncatedPreview = preview.length > 50 ? preview.slice(0, 50) + '...' : preview
    announce(`New message from ${senderName}: ${truncatedPreview}`)
  }

  /**
   * Announce message sent successfully
   */
  const announceMessageSent = () => {
    announce('Message sent')
  }

  /**
   * Announce message failed
   */
  const announceMessageFailed = () => {
    announce('Message failed to send. Press Enter to retry.', 'assertive')
  }

  /**
   * Announce typing indicator
   */
  const announceTyping = (names: string[]) => {
    if (names.length === 0) return

    if (names.length === 1) {
      announce(`${names[0]} is typing`)
    } else if (names.length === 2) {
      announce(`${names[0]} and ${names[1]} are typing`)
    } else {
      announce(`${names[0]} and ${names.length - 1} others are typing`)
    }
  }

  /**
   * Keyboard navigation helpers
   */
  const handleChatKeyboard = (event: KeyboardEvent, options: {
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onHome?: () => void
    onEnd?: () => void
  }) => {
    switch (event.key) {
      case 'Escape':
        options.onEscape?.()
        break
      case 'ArrowUp':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          options.onArrowUp?.()
        }
        break
      case 'ArrowDown':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          options.onArrowDown?.()
        }
        break
      case 'Home':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          options.onHome?.()
        }
        break
      case 'End':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          options.onEnd?.()
        }
        break
    }
  }

  /**
   * Focus trap for modals and overlays
   */
  const createFocusTrap = (containerRef: Ref<HTMLElement | null>) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.value) return

      const focusableElements = containerRef.value.querySelectorAll(focusableSelectors)
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    return {
      activate: () => {
        document.addEventListener('keydown', trapFocus)
      },
      deactivate: () => {
        document.removeEventListener('keydown', trapFocus)
      }
    }
  }

  // Cleanup
  onUnmounted(() => {
    if (announcementTimeout) clearTimeout(announcementTimeout)
  })

  return {
    announcements: readonly(announcements),
    announce,
    announceNewMessage,
    announceMessageSent,
    announceMessageFailed,
    announceTyping,
    handleChatKeyboard,
    createFocusTrap
  }
}
