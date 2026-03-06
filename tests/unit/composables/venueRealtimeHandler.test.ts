import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useVenuesStore } from "~/stores/venues";
import { createVenueRealtimeHandler } from "~/composables/useVenueRealtimeHandler";
import type { ParsedEvent, RealtimeEnvelope } from "~/types/realtime";
import type { NearbyUser } from "~/types/venue";

function makeNearbyUser(overrides: Partial<NearbyUser> = {}): NearbyUser {
  return {
    user_id: 42,
    first_name: "Test",
    profile_picture_url: null,
    ...overrides,
  } as NearbyUser;
}

function makeEnvelope(
  event: string,
  data: Record<string, any>,
): RealtimeEnvelope {
  return {
    event,
    data,
    meta: { timestamp: "2026-01-01T00:00:00Z", version: "1", source: "api" },
  };
}

function makeParsed(action: string, venueId: string = "5"): ParsedEvent {
  return { scope: "venue", id: venueId, action };
}

function makeVenue(id: number, activeUserCount: number = 0) {
  return { id, name: `Venue ${id}`, active_user_count: activeUserCount } as any;
}

describe("createVenueRealtimeHandler", () => {
  let venuesStore: ReturnType<typeof useVenuesStore>;
  let handler: ReturnType<typeof createVenueRealtimeHandler>["handler"];

  beforeEach(() => {
    setActivePinia(createPinia());
    venuesStore = useVenuesStore();
    const result = createVenueRealtimeHandler(venuesStore);
    handler = result.handler;
  });

  describe("active_user_count updates", () => {
    it("increments active_user_count on user_checked_in for any venue in store", () => {
      venuesStore.venues = [makeVenue(5, 3), makeVenue(10, 0)];

      handler(
        makeParsed("user_checked_in", "5"),
        makeEnvelope("venue:5:user_checked_in", makeNearbyUser()),
      );

      expect((venuesStore.venues[0] as any).active_user_count).toBe(4);
      expect((venuesStore.venues[1] as any).active_user_count).toBe(0);
    });

    it("decrements active_user_count on user_checked_out for any venue in store", () => {
      venuesStore.venues = [makeVenue(5, 3)];

      handler(
        makeParsed("user_checked_out", "5"),
        makeEnvelope("venue:5:user_checked_out", { user_id: 42 }),
      );

      expect((venuesStore.venues[0] as any).active_user_count).toBe(2);
    });

    it("does not decrement below zero", () => {
      venuesStore.venues = [makeVenue(5, 0)];

      handler(
        makeParsed("user_checked_out", "5"),
        makeEnvelope("venue:5:user_checked_out", { user_id: 42 }),
      );

      expect((venuesStore.venues[0] as any).active_user_count).toBe(0);
    });

    it("updates selectedVenue when it matches", () => {
      venuesStore.venues = [makeVenue(5, 2)];
      venuesStore.selectedVenue = makeVenue(5, 2);

      handler(
        makeParsed("user_checked_in", "5"),
        makeEnvelope("venue:5:user_checked_in", makeNearbyUser()),
      );

      expect((venuesStore.selectedVenue as any).active_user_count).toBe(3);
    });
  });

  describe("nearbyUsers for selected/checked-in venue", () => {
    it("adds user to nearbyUsers when viewing the venue", () => {
      venuesStore.venues = [makeVenue(5)];
      venuesStore.selectedVenue = { id: 5 } as any;

      const user = makeNearbyUser({ user_id: 42 });
      handler(
        makeParsed("user_checked_in", "5"),
        makeEnvelope("venue:5:user_checked_in", user),
      );

      expect(venuesStore.nearbyUsers).toHaveLength(1);
      expect(venuesStore.nearbyUsers[0].user_id).toBe(42);
    });

    it("adds user when checked into the venue", () => {
      venuesStore.venues = [makeVenue(5)];
      venuesStore.currentCheckIn = { id: 1, venue_id: 5 } as any;

      const user = makeNearbyUser({ user_id: 42 });
      handler(
        makeParsed("user_checked_in", "5"),
        makeEnvelope("venue:5:user_checked_in", user),
      );

      expect(venuesStore.nearbyUsers).toHaveLength(1);
    });

    it("does not add duplicate users", () => {
      venuesStore.venues = [makeVenue(5)];
      venuesStore.selectedVenue = { id: 5 } as any;
      venuesStore.nearbyUsers = [makeNearbyUser({ user_id: 42 })];

      handler(
        makeParsed("user_checked_in", "5"),
        makeEnvelope(
          "venue:5:user_checked_in",
          makeNearbyUser({ user_id: 42 }),
        ),
      );

      expect(venuesStore.nearbyUsers).toHaveLength(1);
    });

    it("does not add user to nearbyUsers for unrelated venue", () => {
      venuesStore.venues = [makeVenue(5), makeVenue(99)];
      venuesStore.selectedVenue = { id: 99 } as any;

      handler(
        makeParsed("user_checked_in", "5"),
        makeEnvelope("venue:5:user_checked_in", makeNearbyUser()),
      );

      // Count should still update
      expect((venuesStore.venues[0] as any).active_user_count).toBe(1);
      // But nearbyUsers should not be affected
      expect(venuesStore.nearbyUsers).toHaveLength(0);
    });

    it("removes user from nearbyUsers on checkout", () => {
      venuesStore.venues = [makeVenue(5, 2)];
      venuesStore.selectedVenue = { id: 5 } as any;
      venuesStore.nearbyUsers = [
        makeNearbyUser({ user_id: 42 }),
        makeNearbyUser({ user_id: 43 }),
      ];

      handler(
        makeParsed("user_checked_out", "5"),
        makeEnvelope("venue:5:user_checked_out", { user_id: 42 }),
      );

      expect(venuesStore.nearbyUsers).toHaveLength(1);
      expect(venuesStore.nearbyUsers[0].user_id).toBe(43);
    });
  });

  describe("edge cases", () => {
    it("ignores events with null venue id", () => {
      venuesStore.venues = [makeVenue(5)];
      venuesStore.selectedVenue = { id: 5 } as any;

      handler(
        { scope: "venue", id: null, action: "user_checked_in" },
        makeEnvelope("venue::user_checked_in", makeNearbyUser()),
      );

      expect(venuesStore.nearbyUsers).toHaveLength(0);
      expect((venuesStore.venues[0] as any).active_user_count).toBe(0);
    });

    it("handles venue not in store gracefully", () => {
      venuesStore.venues = [];

      handler(
        makeParsed("user_checked_in", "999"),
        makeEnvelope("venue:999:user_checked_in", makeNearbyUser()),
      );

      // No crash, no side effects
      expect(venuesStore.nearbyUsers).toHaveLength(0);
    });
  });
});
