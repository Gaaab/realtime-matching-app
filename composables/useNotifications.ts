import { useNotificationsStore } from "~/stores/notifications";
import type { AppNotification } from "~/types/notification";

export const useNotifications = () => {
  const api = useApi();
  const notificationsStore = useNotificationsStore();
  // Toast state
  const activeToast = ref<AppNotification | null>(null);
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  const showToast = (notification: AppNotification) => {
    activeToast.value = notification;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      activeToast.value = null;
    }, 5000);
  };

  const dismissToast = () => {
    activeToast.value = null;
    if (toastTimeout) clearTimeout(toastTimeout);
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get<AppNotification[]>("/notifications");
      if (response.success && response.data) {
        notificationsStore.setNotifications(response.data);
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch notifications");
    } catch (error: any) {
      console.error("Fetch notifications error:", error);
      throw error;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      notificationsStore.markRead(notificationId);
    } catch (error: any) {
      console.error("Mark notification read error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      notificationsStore.markAllRead();
    } catch (error: any) {
      console.error("Mark all notifications read error:", error);
    }
  };

  return {
    activeToast: computed(() => activeToast.value),
    dismissToast,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    notifications: computed(() => notificationsStore.recentNotifications),
    unreadCount: computed(() => notificationsStore.unreadCount),
    hasUnread: computed(() => notificationsStore.hasUnread),
  };
};
