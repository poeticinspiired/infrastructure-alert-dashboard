import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PredictionsState, DeploymentPrediction, OptimalWindows } from '../../types';

const initialState: PredictionsState = {
  predictions: [],
  selectedPrediction: null,
  optimalWindows: null,
  loading: false,
  error: null
};

export const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    fetchPredictionsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchPredictionsSuccess(state, action: PayloadAction<DeploymentPrediction[]>) {
      state.predictions = action.payload;
      state.loading = false;
    },
    fetchPredictionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    selectPrediction(state, action: PayloadAction<string>) {
      state.selectedPrediction = state.predictions.find(
        prediction => prediction.deployment_id === action.payload
      ) || null;
    },
    clearSelectedPrediction(state) {
      state.selectedPrediction = null;
    },
    fetchOptimalWindowsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchOptimalWindowsSuccess(state, action: PayloadAction<OptimalWindows>) {
      state.optimalWindows = action.payload;
      state.loading = false;
    },
    fetchOptimalWindowsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addPrediction(state, action: PayloadAction<DeploymentPrediction>) {
      state.predictions.unshift(action.payload);
    },
    updatePrediction(state, action: PayloadAction<DeploymentPrediction>) {
      const index = state.predictions.findIndex(
        prediction => prediction.deployment_id === action.payload.deployment_id
      );
      if (index !== -1) {
        state.predictions[index] = action.payload;
        if (
          state.selectedPrediction &&
          state.selectedPrediction.deployment_id === action.payload.deployment_id
        ) {
          state.selectedPrediction = action.payload;
        }
      }
    }
  }
});

export const {
  fetchPredictionsStart,
  fetchPredictionsSuccess,
  fetchPredictionsFailure,
  selectPrediction,
  clearSelectedPrediction,
  fetchOptimalWindowsStart,
  fetchOptimalWindowsSuccess,
  fetchOptimalWindowsFailure,
  addPrediction,
  updatePrediction
} = predictionsSlice.actions;

export default predictionsSlice.reducer;
