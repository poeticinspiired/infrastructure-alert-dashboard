import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnalysisState, AnalysisResult } from '../../types';

const initialState: AnalysisState = {
  impactAnalysis: null,
  failureDomains: null,
  healthStatus: null,
  loading: false,
  error: null
};

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    fetchAnalysisStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchImpactAnalysisSuccess(state, action: PayloadAction<AnalysisResult>) {
      state.impactAnalysis = action.payload;
      state.loading = false;
    },
    fetchFailureDomainsSuccess(state, action: PayloadAction<AnalysisResult>) {
      state.failureDomains = action.payload;
      state.loading = false;
    },
    fetchHealthStatusSuccess(state, action: PayloadAction<AnalysisResult>) {
      state.healthStatus = action.payload;
      state.loading = false;
    },
    fetchAnalysisFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearAnalysisData(state) {
      state.impactAnalysis = null;
      state.failureDomains = null;
      state.healthStatus = null;
    }
  }
});

export const {
  fetchAnalysisStart,
  fetchImpactAnalysisSuccess,
  fetchFailureDomainsSuccess,
  fetchHealthStatusSuccess,
  fetchAnalysisFailure,
  clearAnalysisData
} = analysisSlice.actions;

export default analysisSlice.reducer;
