import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UiState, Notification } from '../../types';

const initialState: UiState = {
  darkMode: true,
  sidebarOpen: true,
  notifications: [],
  currentView: 'dashboard',
  refreshInterval: 30000 // 30 seconds
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setCurrentView(state, action: PayloadAction<string>) {
      state.currentView = action.payload;
    },
    setRefreshInterval(state, action: PayloadAction<number>) {
      state.refreshInterval = action.payload;
    },
    addNotification(state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) {
      const id = `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      state.notifications.unshift({
        ...action.payload,
        id,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      // Limit to 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationAsRead(state, action: PayloadAction<string>) {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead(state) {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    clearNotifications(state) {
      state.notifications = [];
    }
  }
});

export const {
  toggleDarkMode,
  toggleSidebar,
  setSidebarOpen,
  setCurrentView,
  setRefreshInterval,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications
} = uiSlice.actions;

export default uiSlice.reducer;
