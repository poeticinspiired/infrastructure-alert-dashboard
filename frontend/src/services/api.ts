import axios from 'axios';
import { Alert, InfrastructureComponent, AnalysisResult, DeploymentPrediction, OptimalWindows } from '../types';

// Base API URL - would be configured from environment in a real app
const API_URL = 'http://localhost:5000/api';

// Alerts API
export const alertsApi = {
  getAlerts: async (filters = {}) => {
    const response = await axios.get(`${API_URL}/alerts`, { params: filters });
    return response.data;
  },
  
  getAlert: async (alertId: string) => {
    const response = await axios.get(`${API_URL}/alerts/${alertId}`);
    return response.data;
  },
  
  createAlert: async (alertData: Partial<Alert>) => {
    const response = await axios.post(`${API_URL}/alerts`, alertData);
    return response.data;
  },
  
  updateAlert: async (alertId: string, alertData: Partial<Alert>) => {
    const response = await axios.put(`${API_URL}/alerts/${alertId}`, alertData);
    return response.data;
  },
  
  deleteAlert: async (alertId: string) => {
    await axios.delete(`${API_URL}/alerts/${alertId}`);
    return alertId;
  }
};

// Infrastructure API
export const infrastructureApi = {
  getComponents: async (filters = {}) => {
    const response = await axios.get(`${API_URL}/infrastructure`, { params: filters });
    return response.data;
  },
  
  getComponent: async (componentId: string) => {
    const response = await axios.get(`${API_URL}/infrastructure/${componentId}`);
    return response.data;
  },
  
  createComponent: async (componentData: Partial<InfrastructureComponent>) => {
    const response = await axios.post(`${API_URL}/infrastructure`, componentData);
    return response.data;
  },
  
  updateComponent: async (componentId: string, componentData: Partial<InfrastructureComponent>) => {
    const response = await axios.put(`${API_URL}/infrastructure/${componentId}`, componentData);
    return response.data;
  },
  
  deleteComponent: async (componentId: string) => {
    await axios.delete(`${API_URL}/infrastructure/${componentId}`);
    return componentId;
  },
  
  addRelationship: async (dependentId: string, dependencyId: string) => {
    const response = await axios.post(`${API_URL}/infrastructure/relationships`, {
      dependent_id: dependentId,
      dependency_id: dependencyId
    });
    return response.data;
  },
  
  removeRelationship: async (dependentId: string, dependencyId: string) => {
    const response = await axios.delete(`${API_URL}/infrastructure/relationships`, {
      data: {
        dependent_id: dependentId,
        dependency_id: dependencyId
      }
    });
    return response.data;
  },
  
  getAffectedComponents: async (componentId: string) => {
    const response = await axios.get(`${API_URL}/infrastructure/${componentId}/affected`);
    return response.data;
  }
};

// Analysis API
export const analysisApi = {
  getImpactAnalysis: async (componentId: string) => {
    const response = await axios.get(`${API_URL}/analysis/impact`, {
      params: { component_id: componentId }
    });
    return response.data;
  },
  
  getFailureDomains: async (componentIds: string[]) => {
    const response = await axios.post(`${API_URL}/analysis/failure-domains`, {
      component_ids: componentIds
    });
    return response.data;
  },
  
  getHealthStatus: async () => {
    const response = await axios.get(`${API_URL}/analysis/health-status`);
    return response.data;
  }
};

// Predictions API
export const predictionsApi = {
  getPredictions: async (filters = {}) => {
    const response = await axios.get(`${API_URL}/predictions`, { params: filters });
    return response.data;
  },
  
  getPrediction: async (deploymentId: string) => {
    const response = await axios.get(`${API_URL}/predictions/${deploymentId}`);
    return response.data;
  },
  
  createPrediction: async (deploymentData: any) => {
    const response = await axios.post(`${API_URL}/predictions`, deploymentData);
    return response.data;
  },
  
  getOptimalWindows: async () => {
    const response = await axios.get(`${API_URL}/predictions/windows`);
    return response.data;
  }
};
