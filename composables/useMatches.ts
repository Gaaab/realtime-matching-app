import { useMatchesStore } from "~/stores/matches";
import type {
  Match,
  ProfileReveal,
  MatchAction,
  MatchFilters,
} from "~/types/match";
import type { PaginatedResponse } from "~/types/api";
import { createMatchRealtimeHandler } from "~/composables/useMatchRealtimeHandler";

export const useMatches = () => {
  const api = useApi();
  const matchesStore = useMatchesStore();

  // Register realtime event handler for match events
  const { registerHandler, unregisterHandler } = useRealtime();
  const { handler: matchRealtimeHandler } =
    createMatchRealtimeHandler(matchesStore);
  registerHandler("user", matchRealtimeHandler);

  onBeforeUnmount(() => {
    unregisterHandler("user", matchRealtimeHandler);
  });

  const fetchMatches = async (
    filters?: Partial<MatchFilters>,
    page: number = 1,
  ) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const params = {
        ...filters,
        page,
      };

      const response = await api.get<PaginatedResponse<Match>>(
        "/match/matches",
        params,
      );

      if (response.success && response.data) {
        if (page === 1) {
          matchesStore.setMatches(response.data.data);
        } else {
          matchesStore.addMatches(response.data.data);
        }

        matchesStore.setCurrentPage(response.data.current_page);
        matchesStore.setHasMore(
          response.data.current_page < response.data.last_page,
        );

        return response.data;
      }

      throw new Error(response.message || "Failed to fetch matches");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch matches";
      matchesStore.setError(errorMessage);
      console.error("Fetch matches error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const loadMoreMatches = async () => {
    if (!matchesStore.hasMore || matchesStore.loading) {
      return;
    }

    const nextPage = matchesStore.currentPage + 1;
    return await fetchMatches(matchesStore.filters, nextPage);
  };

  const fetchMatch = async (matchId: number) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const response = await api.get<Match>(`/match/matches/${matchId}`);

      if (response.success && response.data) {
        matchesStore.addMatch(response.data);
        matchesStore.setCurrentMatch(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to fetch match");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch match";
      matchesStore.setError(errorMessage);
      console.error("Fetch match error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const performMatchAction = async (
    userId: number,
    action: "like" | "pass" | "super_like",
  ) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const actionData: MatchAction = {
        user_id: userId,
        action,
      };

      const response = await api.post<Match | null>(
        "/match/action",
        actionData,
      );

      if (response.success) {
        if (response.data) {
          // It's a match!
          matchesStore.addMatch(response.data);
        }
        return {
          isMatch: !!response.data,
          match: response.data,
        };
      }

      throw new Error(response.message || "Failed to perform match action");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to perform match action";
      matchesStore.setError(errorMessage);
      console.error("Match action error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const likeProfile = async (userId: number) => {
    return await performMatchAction(userId, "like");
  };

  const passProfile = async (userId: number) => {
    return await performMatchAction(userId, "pass");
  };

  const superLikeProfile = async (userId: number) => {
    return await performMatchAction(userId, "super_like");
  };

  const acceptMatch = async (matchId: number) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const response = await api.post<Match>(
        `/match/matches/${matchId}/accept`,
      );

      if (response.success && response.data) {
        matchesStore.updateMatch(matchId, response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to accept match");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to accept match";
      matchesStore.setError(errorMessage);
      console.error("Accept match error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const rejectMatch = async (matchId: number) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const response = await api.post<Match>(
        `/match/matches/${matchId}/reject`,
      );

      if (response.success && response.data) {
        matchesStore.updateMatch(matchId, response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to reject match");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to reject match";
      matchesStore.setError(errorMessage);
      console.error("Reject match error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const unmatchUser = async (matchId: number) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const response = await api.delete(`/match/matches/${matchId}`);

      if (response.success) {
        matchesStore.removeMatch(matchId);
        return true;
      }

      throw new Error(response.message || "Failed to unmatch user");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to unmatch user";
      matchesStore.setError(errorMessage);
      console.error("Unmatch user error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const fetchReveals = async () => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const response = await api.get<ProfileReveal[]>("/match/reveals");

      if (response.success && response.data) {
        matchesStore.setReveals(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to fetch reveals");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch reveals";
      matchesStore.setError(errorMessage);
      console.error("Fetch reveals error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const revealProfile = async (
    userId: number,
    revealType: "full" | "partial" = "full",
  ) => {
    try {
      matchesStore.setLoading(true);
      matchesStore.setError(null);

      const response = await api.post<ProfileReveal>("/match/reveals", {
        user_id: userId,
        reveal_type: revealType,
      });

      if (response.success && response.data) {
        matchesStore.addReveal(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to reveal profile");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to reveal profile";
      matchesStore.setError(errorMessage);
      console.error("Reveal profile error:", error);
      throw error;
    } finally {
      matchesStore.setLoading(false);
    }
  };

  const sendReveal = async (userId: number, venueId?: number) => {
    try {
      const payload: any = {
        user_id: userId,
        reveal_type: "full",
      };

      if (venueId) {
        payload.venue_id = venueId;
      }

      const response = await api.post<ProfileReveal>("/match/reveals", payload);

      if (response.success && response.data) {
        matchesStore.addReveal(response.data);
        return response.data;
      }

      throw new Error(response.message || "Failed to send reveal");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send reveal";
      console.error("Send reveal error:", error);
      throw error;
    }
  };

  const updateFilters = (filters: Partial<MatchFilters>) => {
    matchesStore.setFilters(filters);
    matchesStore.resetPagination();
  };

  return {
    fetchMatches,
    loadMoreMatches,
    fetchMatch,
    likeProfile,
    passProfile,
    superLikeProfile,
    acceptMatch,
    rejectMatch,
    unmatchUser,
    fetchReveals,
    revealProfile,
    sendReveal,
    updateFilters,
    matches: computed(() => matchesStore.matches),
    activeMatches: computed(() => matchesStore.activeMatches),
    pendingMatches: computed(() => matchesStore.pendingMatches),
    reveals: computed(() => matchesStore.reveals),
    currentMatch: computed(() => matchesStore.currentMatch),
    filters: computed(() => matchesStore.filters),
    loading: computed(() => matchesStore.loading),
    isLoading: computed(() => matchesStore.loading),
    error: computed(() => matchesStore.error),
    hasMore: computed(() => matchesStore.hasMore),
  };
};
