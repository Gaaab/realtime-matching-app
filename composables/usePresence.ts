import { usePresenceStore } from "~/stores/presence";

export const usePresence = () => {
  const presenceStore = usePresenceStore();

  const isOnline = (userId: number) => presenceStore.isOnline(userId);
  const getPresence = (userId: number) => presenceStore.getPresence(userId);

  return {
    isOnline,
    getPresence,
  };
};
