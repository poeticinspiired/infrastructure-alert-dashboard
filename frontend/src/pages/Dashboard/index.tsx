import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, Chip, Stack, CircularProgress, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchAlertsStart, fetchAlertsSuccess, fetchAlertsFailure } from '../../features/alerts/alertsSlice';
import { fetchComponentsStart, fetchComponentsSuccess, fetchComponentsFailure } from '../../features/infrastructure/infrastructureSlice';
import { fetchHealthStatusSuccess, fetchAnalysisFailure } from '../../features/analysis/analysisSlice';
import { alertsApi, infrastructureApi, analysisApi } from '../../services/api';
import { Alert, AlertSeverity, AlertStatus, ComponentStatus } from '../../types';
import InfrastructureGraph from '../InfrastructureGraph/InfrastructureGraph';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { alerts, loading: alertsLoading } = useSelector((state: RootState) => state.alerts);
  const { components, loading: componentsLoading } = useSelector((state: RootState) => state.infrastructure);
  const { healthStatus } = useSelector((state: RootState) => state.analysis);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch alerts
        dispatch(fetchAlertsStart());
        const alertsData = await alertsApi.getAlerts();
        dispatch(fetchAlertsSuccess(alertsData));

        // Fetch infrastructure components
        dispatch(fetchComponentsStart());
        const componentsData = await infrastructureApi.getComponents();
        dispatch(fetchComponentsSuccess(componentsData));

        // Fetch health status
        const healthData = await analysisApi.getHealthStatus();
        dispatch(fetchHealthStatusSuccess(healthData));
      } catch (error) {
        dispatch(fetchAlertsFailure(error.message));
        dispatch(fetchComponentsFailure(error.message));
        dispatch(fetchAnalysisFailure(error.message));
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

  // Calculate alert statistics
  const alertStats = {
    critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
    high: alerts.filter(a => a.severity === AlertSeverity.HIGH).length,
    medium: alerts.filter(a => a.severity === AlertSeverity.MEDIUM).length,
    low: alerts.filter(a => a.severity === AlertSeverity.LOW).length,
    new: alerts.filter(a => a.status === AlertStatus.NEW).length,
    acknowledged: alerts.filter(a => a.status === AlertStatus.ACKNOWLEDGED).length,
    inProgress: alerts.filter(a => a.status === AlertStatus.IN_PROGRESS).length,
    resolved: alerts.filter(a => a.status === AlertStatus.RESOLVED).length
  };

  // Calculate component health statistics
  const componentStats = {
    total: Object.keys(components).length,
    healthy: Object.values(components).filter(c => c.status === ComponentStatus.HEALTHY).length,
    degraded: Object.values(components).filter(c => c.status === ComponentStatus.DEGRADED).length,
    warning: Object.values(components).filter(c => c.status === ComponentStatus.WARNING).length,
    critical: Object.values(components).filter(c => c.status === ComponentStatus.CRITICAL).length,
    maintenance: Object.values(components).filter(c => c.status === ComponentStatus.MAINTENANCE).length
  };

  // Get recent alerts
  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 3 }}>
        Infrastructure Overview
      </Typography>

      {/* Alert Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: theme => theme.palette.error.dark,
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>Critical Alerts</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 'auto' }}>
              {alertsLoading ? <CircularProgress size={40} /> : alertStats.critical}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: theme => theme.palette.warning.dark,
              color: 'black'
            }}
          >
            <Typography variant="h6" gutterBottom>High Priority Alerts</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 'auto' }}>
              {alertsLoading ? <CircularProgress size={40} /> : alertStats.high}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: theme => theme.palette.info.dark,
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>Components Affected</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 'auto' }}>
              {componentsLoading ? (
                <CircularProgress size={40} />
              ) : (
                Object.values(components).filter(c => c.active_alerts.length > 0).length
              )}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: theme => theme.palette.success.dark,
              color: 'black'
            }}
          >
            <Typography variant="h6" gutterBottom>Healthy Components</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 'auto' }}>
              {componentsLoading ? <CircularProgress size={40} /> : componentStats.healthy}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Infrastructure Graph */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 500
            }}
          >
            <Typography variant="h6" gutterBottom>Infrastructure Map</Typography>
            {componentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <InfrastructureGraph
                data={graphData}
                width={800}
                height={450}
                onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
              />
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 500,
              overflow: 'auto'
            }}
          >
            <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
            {alertsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                {recentAlerts.map((alert) => (
                  <Card key={alert.alert_id} sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={alert.severity}
                          size="small"
                          sx={{
                            backgroundColor: 
                              alert.severity === AlertSeverity.CRITICAL ? 'error.main' :
                              alert.severity === AlertSeverity.HIGH ? 'warning.main' :
                              alert.severity === AlertSeverity.MEDIUM ? 'info.main' : 'success.main',
                            color: 
                              alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH
                                ? 'white' : 'black'
                          }}
                        />
                        <Chip
                          label={alert.status}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {alert.alert_type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {alert.description}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Source: {alert.source_component}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                {recentAlerts.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No recent alerts
                  </Typography>
                )}
                <Button variant="outlined" sx={{ mt: 2 }}>View All Alerts</Button>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
