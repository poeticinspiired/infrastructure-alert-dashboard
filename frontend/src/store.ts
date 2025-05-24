import { configureStore } from '@reduxjs/toolkit';
import alertsReducer from './features/alerts/alertsSlice';
import infrastructureReducer from './features/infrastructure/infrastructureSlice';
import analysisReducer from './features/analysis/analysisSlice';
import predictionsReducer from './features/predictions/predictionsSlice';
import uiReducer from './features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    alerts: alertsReducer,
    infrastructure: infrastructureReducer,
    analysis: analysisReducer,
    predictions: predictionsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
