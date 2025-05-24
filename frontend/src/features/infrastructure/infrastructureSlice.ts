import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InfrastructureState, InfrastructureComponent, ComponentStatus, ComponentType } from '../../types';

const initialState: InfrastructureState = {
  components: {},
  selectedComponent: null,
  loading: false,
  error: null,
  filters: {}
};

export const infrastructureSlice = createSlice({
  name: 'infrastructure',
  initialState,
  reducers: {
    fetchComponentsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchComponentsSuccess(state, action: PayloadAction<InfrastructureComponent[]>) {
      state.loading = false;
      // Convert array to object with component_id as key
      state.components = action.payload.reduce((acc, component) => {
        acc[component.component_id] = component;
        return acc;
      }, {} as Record<string, InfrastructureComponent>);
    },
    fetchComponentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    selectComponent(state, action: PayloadAction<string>) {
      state.selectedComponent = action.payload;
    },
    clearSelectedComponent(state) {
      state.selectedComponent = null;
    },
    updateComponentStatus(state, action: PayloadAction<{ componentId: string, status: ComponentStatus }>) {
      const { componentId, status } = action.payload;
      if (state.components[componentId]) {
        state.components[componentId].status = status;
        state.components[componentId].updated_at = new Date().toISOString();
      }
    },
    updateComponentFilters(state, action: PayloadAction<{
      type?: ComponentType;
      status?: ComponentStatus;
      location?: string;
      owner?: string;
      hasAlerts?: boolean;
    }>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearComponentFilters(state) {
      state.filters = {};
    },
    addComponent(state, action: PayloadAction<InfrastructureComponent>) {
      state.components[action.payload.component_id] = action.payload;
    },
    updateComponent(state, action: PayloadAction<InfrastructureComponent>) {
      state.components[action.payload.component_id] = action.payload;
    },
    deleteComponent(state, action: PayloadAction<string>) {
      delete state.components[action.payload];
      if (state.selectedComponent === action.payload) {
        state.selectedComponent = null;
      }
    },
    addComponentRelationship(state, action: PayloadAction<{ dependentId: string, dependencyId: string }>) {
      const { dependentId, dependencyId } = action.payload;
      
      // Add dependency to dependent
      if (state.components[dependentId] && !state.components[dependentId].dependencies.includes(dependencyId)) {
        state.components[dependentId].dependencies.push(dependencyId);
        state.components[dependentId].updated_at = new Date().toISOString();
      }
      
      // Add dependent to dependency
      if (state.components[dependencyId] && !state.components[dependencyId].dependents.includes(dependentId)) {
        state.components[dependencyId].dependents.push(dependentId);
        state.components[dependencyId].updated_at = new Date().toISOString();
      }
    },
    removeComponentRelationship(state, action: PayloadAction<{ dependentId: string, dependencyId: string }>) {
      const { dependentId, dependencyId } = action.payload;
      
      // Remove dependency from dependent
      if (state.components[dependentId]) {
        state.components[dependentId].dependencies = state.components[dependentId].dependencies.filter(
          id => id !== dependencyId
        );
        state.components[dependentId].updated_at = new Date().toISOString();
      }
      
      // Remove dependent from dependency
      if (state.components[dependencyId]) {
        state.components[dependencyId].dependents = state.components[dependencyId].dependents.filter(
          id => id !== dependentId
        );
        state.components[dependencyId].updated_at = new Date().toISOString();
      }
    },
    addAlertToComponent(state, action: PayloadAction<{ componentId: string, alertId: string }>) {
      const { componentId, alertId } = action.payload;
      if (state.components[componentId] && !state.components[componentId].active_alerts.includes(alertId)) {
        state.components[componentId].active_alerts.push(alertId);
        state.components[componentId].updated_at = new Date().toISOString();
      }
    },
    removeAlertFromComponent(state, action: PayloadAction<{ componentId: string, alertId: string }>) {
      const { componentId, alertId } = action.payload;
      if (state.components[componentId]) {
        state.components[componentId].active_alerts = state.components[componentId].active_alerts.filter(
          id => id !== alertId
        );
        state.components[componentId].updated_at = new Date().toISOString();
      }
    }
  }
});

export const {
  fetchComponentsStart,
  fetchComponentsSuccess,
  fetchComponentsFailure,
  selectComponent,
  clearSelectedComponent,
  updateComponentStatus,
  updateComponentFilters,
  clearComponentFilters,
  addComponent,
  updateComponent,
  deleteComponent,
  addComponentRelationship,
  removeComponentRelationship,
  addAlertToComponent,
  removeAlertFromComponent
} = infrastructureSlice.actions;

export default infrastructureSlice.reducer;
