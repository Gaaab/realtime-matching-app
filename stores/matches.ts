import { defineStore } from 'pinia'
import type { Match, ProfileReveal, MatchFilters } from '~/types/match'

interface MatchesState {
  matches: Match[]
  reveals: ProfileReveal[]
  currentMatch: Match | null
  filters: MatchFilters
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
}

export const useMatchesStore = defineStore('matches', {
  state: (): MatchesState => ({
    matches: [],
    reveals: [],
    currentMatch: null,
    filters: {
      max_distance: 50,
    },
    loading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
  }),

  getters: {
    activeMatches: (state) => {
      return state.matches.filter(
        match => match.status === 'accepted' && new Date(match.expires_at) > new Date()
      )
    },

    pendingMatches: (state) => {
      return state.matches.filter(match => match.status === 'pending')
    },

    expiredMatches: (state) => {
      return state.matches.filter(
        match => match.status === 'accepted' && new Date(match.expires_at) <= new Date()
      )
    },

    matchCount: (state) => state.matches.length,

    activeMatchCount: (state, getters) => getters.activeMatches.length,

    getMatchById: (state) => {
      return (matchId: number) => state.matches.find(match => match.id === matchId)
    },

    sortedMatches: (state) => {
      return [...state.matches].sort((a, b) => {
        return new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime()
      })
    },

    recentReveals: (state) => {
      return [...state.reveals].sort((a, b) => {
        return new Date(b.revealed_at).getTime() - new Date(a.revealed_at).getTime()
      })
    },
  },

  actions: {
    setMatches(matches: Match[]) {
      this.matches = matches
    },

    addMatches(matches: Match[]) {
      const existingIds = new Set(this.matches.map(m => m.id))
      const newMatches = matches.filter(m => !existingIds.has(m.id))
      this.matches.push(...newMatches)
    },

    addMatch(match: Match) {
      const existingIndex = this.matches.findIndex(m => m.id === match.id)
      if (existingIndex >= 0) {
        this.matches[existingIndex] = match
      } else {
        this.matches.unshift(match)
      }
    },

    updateMatch(matchId: number, data: Partial<Match>) {
      const index = this.matches.findIndex(m => m.id === matchId)
      if (index >= 0) {
        this.matches[index] = { ...this.matches[index], ...data }
      }
    },

    removeMatch(matchId: number) {
      this.matches = this.matches.filter(m => m.id !== matchId)
    },

    setReveals(reveals: ProfileReveal[]) {
      this.reveals = reveals
    },

    addReveal(reveal: ProfileReveal) {
      const existingIndex = this.reveals.findIndex(r => r.id === reveal.id)
      if (existingIndex >= 0) {
        this.reveals[existingIndex] = reveal
      } else {
        this.reveals.unshift(reveal)
      }
    },

    setCurrentMatch(match: Match | null) {
      this.currentMatch = match
    },

    setFilters(filters: Partial<MatchFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    setHasMore(hasMore: boolean) {
      this.hasMore = hasMore
    },

    setCurrentPage(page: number) {
      this.currentPage = page
    },

    incrementPage() {
      this.currentPage++
    },

    resetPagination() {
      this.currentPage = 1
      this.hasMore = true
    },

    clearMatches() {
      this.matches = []
      this.reveals = []
      this.currentMatch = null
      this.error = null
      this.resetPagination()
    },
  },
})
