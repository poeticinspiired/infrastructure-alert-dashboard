import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchComponentsStart, 
  fetchComponentsSuccess, 
  fetchComponentsFailure,
  selectComponent,
  updateComponentStatus
} from '../../features/infrastructure/infrastructureSlice';
import { infrastructureApi, analysisApi } from '../../services/api';
import { ComponentStatus, ComponentType } from '../../types';
import InfrastructureGraph from '../../components/InfrastructureGraph/InfrastructureGraph';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`infrastructure-tabpanel-${index}`}
      aria-labelledby={`infrastructure-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Infrastructure: React.FC = () => {
  const dispatch = useDispatch();
  const { components, selectedComponent, loading } = useSelector((state: RootState) => state.infrastructure);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [affectedComponents, setAffectedComponents] = useState<string[]>([]);
  const [loadingAffected, setLoadingAffected] = useState(false);

  // Fetch infrastructure components on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(fetchComponentsStart());
        const componentsData = await infrastructureApi.getComponents();
        dispatch(fetchComponentsSuccess(componentsData));
      } catch (error) {
        dispatch(fetchComponentsFailure(error.message));
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Prepare graph data when components are loaded
  useEffect(() => {
    if (Object.keys(components).length > 0) {
      const nodes = Object.values(components).map(component => ({
        id: component.component_id,
        name: component.name,
        type: component.component_type,
        status: component.status
      }));

      const links = [];
      Object.values(components).forEach(component => {
        component.dependencies.forEach(depId => {
          links.push({
            source: component.component_id,
            target: depId,
            value: 1
          });
        });
      });

      setGraphData({ nodes, links });
    }
  }, [components]);

  // Handle component selection
  const handleSelectComponent = async (componentId: string) => {
    dispatch(selectComponent(componentId));
    setDetailsOpen(true);
    
    // Fetch affected components
    try {
      setLoadingAffected(true);
      const affected = await infrastructureApi.getAffectedComponents(componentId);
      setAffectedComponents(affected.map(comp => comp.component_id));
    } catch (error) {
      console.error('Failed to fetch affected components:', error);
    } finally {
      setLoadingAffected(false);
    }
  };

  // Handle component status update
  const handleUpdateStatus = async (componentId: string, status: ComponentStatus) => {
    try {
      await infrastructureApi.updateComponent(componentId, { status });
      dispatch(updateComponentStatus({ componentId, status }));
    } catch (error) {
      console.error('Failed to update component status:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get status color
  const getStatusColor = (status: ComponentStatus) => {
    switch (status) {
      case ComponentStatus.HEALTHY:
        return 'success';
      case ComponentStatus.DEGRADED:
      case ComponentStatus.WARNING:
        return 'warning';
      case ComponentStatus.CRITICAL:
        return 'error';
      case ComponentStatus.MAINTENANCE:
        return 'info';
      default:
        return 'default';
    }
  };

  // Get component type display name
  const getComponentTypeDisplay = (type: ComponentType) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 3 }}>
        Infrastructure Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Graph View" />
          <Tab label="List View" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <InfrastructureGraph
                data={graphData}
                width={1200}
                height={800}
                onNodeClick={handleSelectComponent}
              />
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {Object.values(components).map((component) => (
                <Grid item xs={12} sm={6} md={4} key={component.component_id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      borderLeft: `4px solid ${
                        component.status === ComponentStatus.CRITICAL ? 'error.main' :
                        component.status === ComponentStatus.WARNING ? 'warning.main' :
                        component.status === ComponentStatus.DEGRADED ? 'warning.light' :
                        component.status === ComponentStatus.HEALTHY ? 'success.main' :
                        component.status === ComponentStatus.MAINTENANCE ? 'info.main' : 'grey.500'
                      }`
                    }}
                    onClick={() => handleSelectComponent(component.component_id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {component.name}
                        </Typography>
                        <Chip 
                          label={component.status} 
                          size="small"
                          color={getStatusColor(component.status)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getComponentTypeDisplay(component.component_type)}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" display="block">
                          Dependencies: {component.dependencies.length}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Dependents: {component.dependents.length}
                        </Typography>
                        {component.active_alerts.length > 0 && (
                          <Chip 
                            label={`${component.active_alerts.length} active alerts`} 
                            size="small"
                            color="error"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {Object.keys(components).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    No components found
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Component Details Dialog */}
      {selectedComponent && components[selectedComponent] && (
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {components[selectedComponent].name}
              </Typography>
              <Chip 
                label={components[selectedComponent].status} 
                color={getStatusColor(components[selectedComponent].status)}
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Component Details
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>ID:</strong> {components[selectedComponent].component_id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {getComponentTypeDisplay(components[selectedComponent].component_type)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {components[selectedComponent].status}
                      </Typography>
                      {components[selectedComponent].location && (
                        <Typography variant="body2">
                          <strong>Location:</strong> {components[selectedComponent].location}
                        </Typography>
                      )}
                      {components[selectedComponent].owner && (
                        <Typography variant="body2">
                          <strong>Owner:</strong> {components[selectedComponent].owner}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Created:</strong> {new Date(components[selectedComponent].created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Updated:</strong> {new Date(components[selectedComponent].updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Update Status
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={components[selectedComponent].status}
                          label="Status"
                          onChange={(e) => handleUpdateStatus(selectedComponent, e.target.value as ComponentStatus)}
                        >
                          <MenuItem value={ComponentStatus.HEALTHY}>Healthy</MenuItem>
                          <MenuItem value={ComponentStatus.DEGRADED}>Degraded</MenuItem>
                          <MenuItem value={ComponentStatus.WARNING}>Warning</MenuItem>
                          <MenuItem value={ComponentStatus.CRITICAL}>Critical</MenuItem>
                          <MenuItem value={ComponentStatus.MAINTENANCE}>Maintenance</MenuItem>
                          <MenuItem value={ComponentStatus.UNKNOWN}>Unknown</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dependencies
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {components[selectedComponent].dependencies.length > 0 ? (
                        components[selectedComponent].dependencies.map((depId) => (
                          <Chip 
                            key={depId} 
                            label={components[depId]?.name || depId} 
                            size="small" 
                            sx={{ mr: 1, mb: 1 }} 
                            onClick={() => handleSelectComponent(depId)}
                          />
                        ))
                      ) : (
                        <Typography variant="body2">No dependencies</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dependents
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {components[selectedComponent].dependents.length > 0 ? (
                        components[selectedComponent].dependents.map((depId) => (
                          <Chip 
                            key={depId} 
                            label={components[depId]?.name || depId} 
                            size="small" 
                            sx={{ mr: 1, mb: 1 }} 
                            onClick={() => handleSelectComponent(depId)}
                          />
                        ))
                      ) : (
                        <Typography variant="body2">No dependents</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Active Alerts
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {components[selectedComponent].active_alerts.length > 0 ? (
                        components[selectedComponent].active_alerts.map((alertId, index) => (
                          <Chip 
                            key={index} 
                            label={alertId} 
                            size="small" 
                            color="error"
                            sx={{ mr: 1, mb: 1 }} 
                          />
                        ))
                      ) : (
                        <Typography variant="body2">No active alerts</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Impact Analysis
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        Components that would be affected if this component fails:
                      </Typography>
                      {loadingAffected ? (
                        <CircularProgress size={20} sx={{ ml: 1 }} />
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          {affectedComponents.length > 0 ? (
                            affectedComponents.map((compId) => (
                              <Chip 
                                key={compId} 
                                label={components[compId]?.name || compId} 
                                size="small" 
                                sx={{ mr: 1, mb: 1 }} 
                                onClick={() => handleSelectComponent(compId)}
                              />
                            ))
                          ) : (
                            <Typography variant="body2">No components would be affected</Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Infrastructure;
