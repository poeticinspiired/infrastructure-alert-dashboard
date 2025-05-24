import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertsState, Alert, AlertStatus, AlertSeverity } from '../../types';

const initialState: AlertsState = {
  alerts: [],
  selectedAlert: null,
  loading: false,
  error: null,
  filters: {}
};

export const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    fetchAlertsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchAlertsSuccess(state, action: PayloadAction<Alert[]>) {
      state.alerts = action.payload;
      state.loading = false;
    },
    fetchAlertsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    selectAlert(state, action: PayloadAction<string>) {
      state.selectedAlert = state.alerts.find(alert => alert.alert_id === action.payload) || null;
    },
    clearSelectedAlert(state) {
      state.selectedAlert = null;
    },
    updateAlertStatus(state, action: PayloadAction<{ alertId: string, status: AlertStatus, notes?: string }>) {
      const { alertId, status, notes } = action.payload;
      const alert = state.alerts.find(a => a.alert_id === alertId);
      if (alert) {
        alert.status = status;
        if (notes) {
          alert.resolution_notes = notes;
        }
        if (status === AlertStatus.RESOLVED && !alert.resolution_time) {
          alert.resolution_time = new Date().toISOString();
        }
      }
      if (state.selectedAlert && state.selectedAlert.alert_id === alertId) {
        state.selectedAlert = { ...alert } as Alert;
      }
    },
    updateAlertFilters(state, action: PayloadAction<{
      status?: AlertStatus;
      severity?: AlertSeverity;
      component?: string;
      fromDate?: string;
      toDate?: string;
    }>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearAlertFilters(state) {
      state.filters = {};
    },
    addNewAlert(state, action: PayloadAction<Alert>) {
      state.alerts.unshift(action.payload);
    },
    updateAlert(state, action: PayloadAction<Alert>) {
      const index = state.alerts.findIndex(alert => alert.alert_id === action.payload.alert_id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
        if (state.selectedAlert && state.selectedAlert.alert_id === action.payload.alert_id) {
          state.selectedAlert = action.payload;
        }
      }
    },
    deleteAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter(alert => alert.alert_id !== action.payload);
      if (state.selectedAlert && state.selectedAlert.alert_id === action.payload) {
        state.selectedAlert = null;
      }
    }
  }
});

export const {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsFailure,
  selectAlert,
  clearSelectedAlert,
  updateAlertStatus,
  updateAlertFilters,
  clearAlertFilters,
  addNewAlert,
  updateAlert,
  deleteAlert
} = alertsSlice.actions;

export default alertsSlice.reducer;
