// Types for Alert data
export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum AlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface Alert {
  alert_id: string;
  timestamp: string;
  source_component: string;
  alert_type: string;
  severity: AlertSeverity;
  description: string;
  status: AlertStatus;
  affected_components: string[];
  metadata?: Record<string, any>;
  assigned_to?: string;
  resolution_time?: string;
  resolution_notes?: string;
  update_history?: AlertUpdate[];
}

export interface AlertUpdate {
  timestamp: string;
  field: string;
  old_value: any;
  new_value: any;
  updated_by: string;
  notes?: string;
}

export interface AlertsState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    component?: string;
    fromDate?: string;
    toDate?: string;
  };
}

// Types for Infrastructure data
export enum ComponentType {
  SERVER = 'server',
  DATABASE = 'database',
  NETWORK = 'network',
  STORAGE = 'storage',
  APPLICATION = 'application',
  SERVICE = 'service',
  CONTAINER = 'container',
  LOAD_BALANCER = 'load_balancer',
  CACHE = 'cache',
  QUEUE = 'queue'
}

export enum ComponentStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
  MAINTENANCE = 'maintenance'
}

export interface InfrastructureComponent {
  component_id: string;
  name: string;
  component_type: ComponentType;
  status: ComponentStatus;
  metadata?: Record<string, any>;
  dependencies: string[];
  dependents: string[];
  location?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
  active_alerts: string[];
}

export interface InfrastructureState {
  components: Record<string, InfrastructureComponent>;
  selectedComponent: string | null;
  loading: boolean;
  error: string | null;
  filters: {
    type?: ComponentType;
    status?: ComponentStatus;
    location?: string;
    owner?: string;
    hasAlerts?: boolean;
  };
}

// Types for Analysis data
export interface AnalysisResult {
  source_component: string;
  affected_components: string[];
  failure_domains: string[][];
  impact_score: number;
  timestamp: string;
}

export interface AnalysisState {
  impactAnalysis: AnalysisResult | null;
  failureDomains: AnalysisResult | null;
  healthStatus: AnalysisResult | null;
  loading: boolean;
  error: string | null;
}

// Types for Prediction data
export interface DeploymentPrediction {
  deployment_id: string;
  components: string[];
  risk_score: number;
  risk_factors: string[];
  recommended_actions: string[];
  optimal_window?: string;
  timestamp: string;
}

export interface OptimalWindow {
  time: string;
  risk_level: 'low' | 'medium' | 'high';
}

export interface OptimalWindows {
  [day: string]: OptimalWindow[];
}

export interface PredictionsState {
  predictions: DeploymentPrediction[];
  selectedPrediction: DeploymentPrediction | null;
  optimalWindows: OptimalWindows | null;
  loading: boolean;
  error: string | null;
}

// Types for UI state
export interface UiState {
  darkMode: boolean;
  sidebarOpen: boolean;
  notifications: Notification[];
  currentView: string;
  refreshInterval: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

// Graph visualization types
export interface GraphNode {
  id: string;
  name: string;
  type: ComponentType;
  status: ComponentStatus;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
