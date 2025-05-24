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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchPredictionsStart, 
  fetchPredictionsSuccess, 
  fetchPredictionsFailure,
  createPredictionStart,
  createPredictionSuccess,
  createPredictionFailure
} from '../../features/predictions/predictionsSlice';
import { predictionsApi } from '../../services/api';
import CalendarHeatmap from '../../components/CalendarHeatmap/CalendarHeatmap';
import BarChart from '../../components/BarChart/BarChart';

const Predictions: React.FC = () => {
  const dispatch = useDispatch();
  const { predictions, optimalWindows, selectedPrediction, loading, error } = useSelector((state: RootState) => state.predictions);
  const { components } = useSelector((state: RootState) => state.infrastructure);
  
  const [newDeploymentDialogOpen, setNewDeploymentDialogOpen] = useState(false);
  const [deploymentData, setDeploymentData] = useState({
    deployment_id: `deploy-${Date.now()}`,
    components: [],
    changes: [],
    planned_time: new Date().toISOString().slice(0, 16),
    deployment_type: 'regular',
    metadata: {}
  });
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [changeDescription, setChangeDescription] = useState('');
  
  // Fetch predictions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(fetchPredictionsStart());
        const [predictionsData, windowsData] = await Promise.all([
          predictionsApi.getPredictions(),
          predictionsApi.getOptimalWindows()
        ]);
        dispatch(fetchPredictionsSuccess({ predictions: predictionsData, optimalWindows: windowsData }));
      } catch (error) {
        dispatch(fetchPredictionsFailure(error.message));
      }
    };
    
    fetchData();
  }, [dispatch]);
  
  // Handle new deployment prediction
  const handleCreatePrediction = async () => {
    // Update deployment data with selected components
    const updatedDeploymentData = {
      ...deploymentData,
      components: selectedComponentIds,
      changes: changeDescription ? [changeDescription] : []
    };
    
    try {
      dispatch(createPredictionStart());
      const result = await predictionsApi.createPrediction(updatedDeploymentData);
      dispatch(createPredictionSuccess(result));
      setNewDeploymentDialogOpen(false);
    } catch (error) {
      dispatch(createPredictionFailure(error.message));
    }
  };
  
  // Prepare data for calendar heatmap
  const prepareCalendarData = () => {
    if (!optimalWindows) return [];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['10:00-12:00', '14:00-16:00'];
    
    return days.flatMap(day => 
      timeSlots.map(time => {
        const slot = optimalWindows[day]?.find(s => s.time === time);
        return {
          day,
          time,
          value: slot ? 
            slot.risk_level === 'low' ? 0.3 : 
            slot.risk_level === 'medium' ? 0.6 : 0.9 : 0.5
        };
      })
    );
  };
  
  // Prepare data for risk factors chart
  const prepareRiskFactorsData = () => {
    if (!selectedPrediction) return [];
    
    return selectedPrediction.risk_factors.map((factor, index) => ({
      name: factor,
      value: 1
    }));
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 3 }}>
        Deployment Risk Predictions
      </Typography>
      
      {/* Actions */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => setNewDeploymentDialogOpen(true)}
            >
              New Deployment Risk Analysis
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              onClick={async () => {
                try {
                  dispatch(fetchPredictionsStart());
                  const [predictionsData, windowsData] = await Promise.all([
                    predictionsApi.getPredictions(),
                    predictionsApi.getOptimalWindows()
                  ]);
                  dispatch(fetchPredictionsSuccess({ predictions: predictionsData, optimalWindows: windowsData }));
                } catch (error) {
                  dispatch(fetchPredictionsFailure(error.message));
                }
              }}
            >
              Refresh Predictions
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
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Optimal Deployment Windows */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimal Deployment Windows
            </Typography>
            {loading && !optimalWindows ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 300 }}>
                <CalendarHeatmap 
                  data={prepareCalendarData()}
                  width={500}
                  height={280}
                />
              </Box>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: 'success.main', mr: 1 }} />
                <Typography variant="body2">Low Risk</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: 'warning.main', mr: 1 }} />
                <Typography variant="body2">Medium Risk</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: 'error.main', mr: 1 }} />
                <Typography variant="body2">High Risk</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Predictions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Deployment Predictions
            </Typography>
            {loading && !predictions.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Deployment</TableCell>
                      <TableCell>Components</TableCell>
                      <TableCell>Risk Score</TableCell>
                      <TableCell>Optimal Window</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictions.map(prediction => (
                      <TableRow 
                        key={prediction.deployment_id}
                        hover
                        onClick={() => dispatch(createPredictionSuccess(prediction))}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{prediction.deployment_id}</TableCell>
                        <TableCell>{prediction.components.length} components</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={prediction.risk_score * 100} 
                              sx={{ 
                                width: 60, 
                                mr: 1,
                                backgroundColor: 'grey.300',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 
                                    prediction.risk_score > 0.7 ? 'error.main' :
                                    prediction.risk_score > 0.4 ? 'warning.main' : 'success.main'
                                }
                              }} 
                            />
                            <Typography variant="body2">
                              {(prediction.risk_score * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{prediction.optimal_window}</TableCell>
                      </TableRow>
                    ))}
                    {predictions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No predictions available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        
        {/* Selected Prediction Details */}
        {selectedPrediction && (
          <>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Deployment Risk Analysis: {selectedPrediction.deployment_id}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Risk Assessment
                        </Typography>
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Risk Score:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={selectedPrediction.risk_score * 100} 
                              sx={{ 
                                height: 10,
                                width: '100%',
                                borderRadius: 5,
                                backgroundColor: 'grey.300',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 
                                    selectedPrediction.risk_score > 0.7 ? 'error.main' :
                                    selectedPrediction.risk_score > 0.4 ? 'warning.main' : 'success.main',
                                  borderRadius: 5
                                }
                              }} 
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption">Low Risk</Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {(selectedPrediction.risk_score * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="caption">High Risk</Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          Recommended Window: <strong>{selectedPrediction.optimal_window}</strong>
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Analysis time: {new Date(selectedPrediction.timestamp).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Risk Factors
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {selectedPrediction.risk_factors.map((factor, index) => (
                            <Chip 
                              key={index}
                              label={factor}
                              color={index < 2 ? "error" : "warning"}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Affected Components
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {selectedPrediction.components.map(compId => (
                            <Chip 
                              key={compId}
                              label={components[compId]?.name || compId}
                              size="small"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recommended Actions
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {selectedPrediction.recommended_actions.map((action, index) => (
                    <Alert 
                      key={index} 
                      severity={index < 2 ? "warning" : "info"}
                      sx={{ mb: 2 }}
                    >
                      {action}
                    </Alert>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
      
      {/* New Deployment Dialog */}
      <Dialog open={newDeploymentDialogOpen} onClose={() => setNewDeploymentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Deployment Risk Analysis</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Deployment ID"
                value={deploymentData.deployment_id}
                onChange={(e) => setDeploymentData({...deploymentData, deployment_id: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Deployment Type</InputLabel>
                <Select
                  value={deploymentData.deployment_type}
                  label="Deployment Type"
                  onChange={(e) => setDeploymentData({...deploymentData, deployment_type: e.target.value})}
                >
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="hotfix">Hotfix</MenuItem>
                  <MenuItem value="major">Major Release</MenuItem>
                  <MenuItem value="minor">Minor Release</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Planned Time"
                type="datetime-local"
                value={deploymentData.planned_time}
                onChange={(e) => setDeploymentData({...deploymentData, planned_time: e.target.value})}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Change Description"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Select Components:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {Object.values(components).map(component => (
                  <Chip
                    key={component.component_id}
                    label={component.name}
                    clickable
                    color={selectedComponentIds.includes(component.component_id) ? 'primary' : 'default'}
                    onClick={() => {
                      if (selectedComponentIds.includes(component.component_id)) {
                        setSelectedComponentIds(selectedComponentIds.filter(id => id !== component.component_id));
                      } else {
                        setSelectedComponentIds([...selectedComponentIds, component.component_id]);
                      }
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Selected: {selectedComponentIds.length} components
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDeploymentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreatePrediction}
            color="primary"
            disabled={selectedComponentIds.length === 0}
          >
            Analyze Risk
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Predictions;
