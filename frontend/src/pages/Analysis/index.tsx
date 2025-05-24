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
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchAnalysisStart, 
  fetchImpactAnalysisSuccess, 
  fetchFailureDomainsSuccess, 
  fetchHealthStatusSuccess, 
  fetchAnalysisFailure 
} from '../../features/analysis/analysisSlice';
import { analysisApi } from '../../services/api';
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
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
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

const Analysis: React.FC = () => {
  const dispatch = useDispatch();
  const { impactAnalysis, failureDomains, healthStatus, loading, error } = useSelector((state: RootState) => state.analysis);
  const { components } = useSelector((state: RootState) => state.infrastructure);
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState('impact');
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Fetch health status on component mount
  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        dispatch(fetchAnalysisStart());
        const result = await analysisApi.getHealthStatus();
        dispatch(fetchHealthStatusSuccess(result));
      } catch (error) {
        dispatch(fetchAnalysisFailure(error.message));
      }
    };
    
    fetchHealthStatus();
  }, [dispatch]);
  
  // Prepare graph data when components or analysis results change
  useEffect(() => {
    if (Object.keys(components).length > 0) {
      // Create base graph from all components
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
      
      // Highlight affected components if analysis results exist
      if (tabValue === 0 && healthStatus) {
        // Health status view - highlight affected components
        const affectedIds = new Set(healthStatus.affected_components);
        nodes.forEach(node => {
          if (affectedIds.has(node.id)) {
            node.status = 'critical'; // Override status for visualization
          }
        });
      } else if (tabValue === 1 && impactAnalysis) {
        // Impact analysis view - highlight affected components
        const affectedIds = new Set(impactAnalysis.affected_components);
        nodes.forEach(node => {
          if (affectedIds.has(node.id)) {
            node.status = 'critical'; // Override status for visualization
          }
        });
      } else if (tabValue === 2 && failureDomains) {
        // Failure domains view - color by domain
        const domainColors = ['critical', 'warning', 'degraded', 'maintenance', 'unknown'];
        failureDomains.failure_domains.forEach((domain, index) => {
          const domainSet = new Set(domain);
          const colorIndex = index % domainColors.length;
          nodes.forEach(node => {
            if (domainSet.has(node.id)) {
              node.status = domainColors[colorIndex]; // Use status for coloring domains
            }
          });
        });
      }
      
      setGraphData({ nodes, links });
    }
  }, [components, healthStatus, impactAnalysis, failureDomains, tabValue]);
  
  // Handle impact analysis
  const handleImpactAnalysis = async () => {
    if (!selectedComponentId) return;
    
    try {
      dispatch(fetchAnalysisStart());
      const result = await analysisApi.getImpactAnalysis(selectedComponentId);
      dispatch(fetchImpactAnalysisSuccess(result));
      setTabValue(1); // Switch to impact analysis tab
      setAnalysisDialogOpen(false);
    } catch (error) {
      dispatch(fetchAnalysisFailure(error.message));
    }
  };
  
  // Handle failure domain analysis
  const handleFailureDomainAnalysis = async () => {
    if (selectedComponents.length === 0) return;
    
    try {
      dispatch(fetchAnalysisStart());
      const result = await analysisApi.getFailureDomains(selectedComponents);
      dispatch(fetchFailureDomainsSuccess(result));
      setTabValue(2); // Switch to failure domains tab
      setAnalysisDialogOpen(false);
    } catch (error) {
      dispatch(fetchAnalysisFailure(error.message));
    }
  };
  
  // Open analysis dialog
  const openAnalysisDialog = (type: string) => {
    setAnalysisType(type);
    setAnalysisDialogOpen(true);
  };
  
  // Handle component selection in graph
  const handleNodeClick = (nodeId: string) => {
    if (analysisType === 'impact') {
      setSelectedComponentId(nodeId);
      handleImpactAnalysis();
    } else {
      // Toggle component selection for failure domain analysis
      if (selectedComponents.includes(nodeId)) {
        setSelectedComponents(selectedComponents.filter(id => id !== nodeId));
      } else {
        setSelectedComponents([...selectedComponents, nodeId]);
      }
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 3 }}>
        Infrastructure Analysis
      </Typography>
      
      {/* Analysis Actions */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => openAnalysisDialog('impact')}
            >
              Run Impact Analysis
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" 
              color="secondary" 
              fullWidth
              onClick={() => openAnalysisDialog('domain')}
            >
              Analyze Failure Domains
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" 
              color="info" 
              fullWidth
              onClick={async () => {
                try {
                  dispatch(fetchAnalysisStart());
                  const result = await analysisApi.getHealthStatus();
                  dispatch(fetchHealthStatusSuccess(result));
                  setTabValue(0); // Switch to health status tab
                } catch (error) {
                  dispatch(fetchAnalysisFailure(error.message));
                }
              }}
            >
              Refresh Health Status
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Analysis Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Health Status" />
          <Tab label="Impact Analysis" />
          <Tab label="Failure Domains" />
        </Tabs>
        
        {/* Health Status Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: 600 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <InfrastructureGraph
                    data={graphData}
                    width={800}
                    height={550}
                    onNodeClick={handleNodeClick}
                  />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Health Status
                  </Typography>
                  {healthStatus ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" sx={{ mr: 1 }}>
                          Impact Score:
                        </Typography>
                        <Chip 
                          label={`${(healthStatus.impact_score * 100).toFixed(0)}%`} 
                          color={
                            healthStatus.impact_score > 0.7 ? 'error' :
                            healthStatus.impact_score > 0.4 ? 'warning' : 'success'
                          }
                        />
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Affected Components: {healthStatus.affected_components.length}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Failure Domains: {healthStatus.failure_domains.length}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No health status data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              {healthStatus && healthStatus.affected_components.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Affected Components
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Component</TableCell>
                            <TableCell>Type</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {healthStatus.affected_components.map(compId => (
                            <TableRow key={compId}>
                              <TableCell>{components[compId]?.name || compId}</TableCell>
                              <TableCell>{components[compId]?.component_type || 'unknown'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Impact Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: 600 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <InfrastructureGraph
                    data={graphData}
                    width={800}
                    height={550}
                    onNodeClick={handleNodeClick}
                  />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Impact Analysis
                  </Typography>
                  {impactAnalysis ? (
                    <>
                      <Typography variant="body1" gutterBottom>
                        Source: {components[impactAnalysis.source_component]?.name || impactAnalysis.source_component}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" sx={{ mr: 1 }}>
                          Impact Score:
                        </Typography>
                        <Chip 
                          label={`${(impactAnalysis.impact_score * 100).toFixed(0)}%`} 
                          color={
                            impactAnalysis.impact_score > 0.7 ? 'error' :
                            impactAnalysis.impact_score > 0.4 ? 'warning' : 'success'
                          }
                        />
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Affected Components: {impactAnalysis.affected_components.length}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Failure Domains: {impactAnalysis.failure_domains.length}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Analysis time: {new Date(impactAnalysis.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No impact analysis data available. Select a component to analyze.
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              {impactAnalysis && impactAnalysis.affected_components.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Affected Components
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Component</TableCell>
                            <TableCell>Type</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {impactAnalysis.affected_components.map(compId => (
                            <TableRow key={compId}>
                              <TableCell>{components[compId]?.name || compId}</TableCell>
                              <TableCell>{components[compId]?.component_type || 'unknown'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Failure Domains Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: 600 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <InfrastructureGraph
                    data={graphData}
                    width={800}
                    height={550}
                    onNodeClick={handleNodeClick}
                  />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Failure Domain Analysis
                  </Typography>
                  {failureDomains ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" sx={{ mr: 1 }}>
                          Impact Score:
                        </Typography>
                        <Chip 
                          label={`${(failureDomains.impact_score * 100).toFixed(0)}%`} 
                          color={
                            failureDomains.impact_score > 0.7 ? 'error' :
                            failureDomains.impact_score > 0.4 ? 'warning' : 'success'
                          }
                        />
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Components Analyzed: {failureDomains.affected_components.length}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Failure Domains Identified: {failureDomains.failure_domains.length}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Analysis time: {new Date(failureDomains.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No failure domain analysis data available. Select components to analyze.
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              {failureDomains && failureDomains.failure_domains.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Identified Domains
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Domain</TableCell>
                            <TableCell>Components</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {failureDomains.failure_domains.map((domain, index) => (
                            <TableRow key={index}>
                              <TableCell>Domain {index + 1}</TableCell>
                              <TableCell>{domain.length} components</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Analysis Dialog */}
      <Dialog open={analysisDialogOpen} onClose={() => setAnalysisDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {analysisType === 'impact' ? 'Impact Analysis' : 'Failure Domain Analysis'}
        </DialogTitle>
        <DialogContent>
          {analysisType === 'impact' ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Component</InputLabel>
              <Select
                value={selectedComponentId}
                label="Select Component"
                onChange={(e) => setSelectedComponentId(e.target.value as string)}
              >
                {Object.values(components).map(component => (
                  <MenuItem key={component.component_id} value={component.component_id}>
                    {component.name} ({component.component_type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Select components to analyze for failure domains:
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.values(components).map(component => (
                  <Chip
                    key={component.component_id}
                    label={component.name}
                    clickable
                    color={selectedComponents.includes(component.component_id) ? 'primary' : 'default'}
                    onClick={() => {
                      if (selectedComponents.includes(component.component_id)) {
                        setSelectedComponents(selectedComponents.filter(id => id !== component.component_id));
                      } else {
                        setSelectedComponents([...selectedComponents, component.component_id]);
                      }
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                Selected: {selectedComponents.length} components
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={analysisType === 'impact' ? handleImpactAnalysis : handleFailureDomainAnalysis}
            color="primary"
            disabled={analysisType === 'impact' ? !selectedComponentId : selectedComponents.length === 0}
          >
            Run Analysis
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Analysis;
