import type { ReportCategory } from '~/types/report'

export const useReport = () => {
  const api = useApi()

  const categories = ref<ReportCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch report categories from the API
   */
  const fetchReportCategories = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<ReportCategory[]>('/report/categories')

      if (response.success && response.data) {
        categories.value = response.data
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch report categories')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch report categories'
      error.value = errorMessage
      console.error('Fetch report categories error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    categories: computed(() => categories.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchReportCategories
  }
}
