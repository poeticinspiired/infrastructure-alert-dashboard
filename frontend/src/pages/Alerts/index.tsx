import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchAlertsStart, 
  fetchAlertsSuccess, 
  fetchAlertsFailure,
  selectAlert,
  updateAlertStatus,
  updateAlertFilters
} from '../../features/alerts/alertsSlice';
import { alertsApi } from '../../services/api';
import { Alert, AlertSeverity, AlertStatus } from '../../types';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const Alerts: React.FC = () => {
  const dispatch = useDispatch();
  const { alerts, selectedAlert, loading, filters } = useSelector((state: RootState) => state.alerts);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Fetch alerts on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(fetchAlertsStart());
        const alertsData = await alertsApi.getAlerts(filters);
        dispatch(fetchAlertsSuccess(alertsData));
      } catch (error) {
        dispatch(fetchAlertsFailure(error.message));
      }
    };
    
    fetchData();
  }, [dispatch, filters]);
  
  // Handle alert selection
  const handleViewAlert = (alertId: string) => {
    dispatch(selectAlert(alertId));
    setDetailsOpen(true);
  };
  
  // Handle alert status update
  const handleUpdateStatus = async (alertId: string, status: AlertStatus, notes?: string) => {
    try {
      await alertsApi.updateAlert(alertId, { status, resolution_notes: notes });
      dispatch(updateAlertStatus({ alertId, status, notes }));
      setDetailsOpen(false);
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (field: string, value: any) => {
    dispatch(updateAlertFilters({ [field]: value }));
  };
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter alerts based on search term
  const filteredAlerts = alerts.filter(alert => 
    alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.source_component.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get severity icon
  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <ErrorIcon color="error" />;
      case AlertSeverity.HIGH:
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case AlertSeverity.MEDIUM:
        return <WarningIcon sx={{ color: 'info.main' }} />;
      case AlertSeverity.LOW:
      case AlertSeverity.INFO:
        return <InfoIcon sx={{ color: 'success.main' }} />;
      default:
        return <InfoIcon />;
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 3 }}>
        Alert Management
      </Typography>
      
      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>
          
          {showFilters && (
            <>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity || ''}
                    label="Severity"
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={AlertSeverity.CRITICAL}>Critical</MenuItem>
                    <MenuItem value={AlertSeverity.HIGH}>High</MenuItem>
                    <MenuItem value={AlertSeverity.MEDIUM}>Medium</MenuItem>
                    <MenuItem value={AlertSeverity.LOW}>Low</MenuItem>
                    <MenuItem value={AlertSeverity.INFO}>Info</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={AlertStatus.NEW}>New</MenuItem>
                    <MenuItem value={AlertStatus.ACKNOWLEDGED}>Acknowledged</MenuItem>
                    <MenuItem value={AlertStatus.IN_PROGRESS}>In Progress</MenuItem>
                    <MenuItem value={AlertStatus.RESOLVED}>Resolved</MenuItem>
                    <MenuItem value={AlertStatus.CLOSED}>Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Component"
                  value={filters.component || ''}
                  onChange={(e) => handleFilterChange('component', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => dispatch(updateAlertFilters({}))}
                >
                  Clear Filters
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Alerts Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Severity</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((alert) => (
                      <TableRow 
                        key={alert.alert_id}
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: 
                            alert.severity === AlertSeverity.CRITICAL ? 'rgba(244, 67, 54, 0.08)' :
                            alert.severity === AlertSeverity.HIGH ? 'rgba(255, 152, 0, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getSeverityIcon(alert.severity)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {alert.severity}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{alert.alert_type}</TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell>{alert.source_component}</TableCell>
                        <TableCell>
                          <Chip 
                            label={alert.status} 
                            size="small"
                            color={
                              alert.status === AlertStatus.NEW ? 'error' :
                              alert.status === AlertStatus.ACKNOWLEDGED ? 'warning' :
                              alert.status === AlertStatus.IN_PROGRESS ? 'info' :
                              alert.status === AlertStatus.RESOLVED ? 'success' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewAlert(alert.alert_id)}
                            aria-label="view alert details"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredAlerts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No alerts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filteredAlerts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Alert Details Dialog */}
      {selectedAlert && (
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getSeverityIcon(selectedAlert.severity)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {selectedAlert.alert_type}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  {selectedAlert.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Alert Details
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>ID:</strong> {selectedAlert.alert_id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Source:</strong> {selectedAlert.source_component}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Severity:</strong> {selectedAlert.severity}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {selectedAlert.status}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}
                      </Typography>
                      {selectedAlert.assigned_to && (
                        <Typography variant="body2">
                          <strong>Assigned To:</strong> {selectedAlert.assigned_to}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Affected Components
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedAlert.affected_components.length > 0 ? (
                        selectedAlert.affected_components.map((component, index) => (
                          <Chip 
                            key={index} 
                            label={component} 
                            size="small" 
                            sx={{ mr: 1, mb: 1 }} 
                          />
                        ))
                      ) : (
                        <Typography variant="body2">No affected components</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {selectedAlert.resolution_notes && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Resolution Notes
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {selectedAlert.resolution_notes}
                      </Typography>
                      {selectedAlert.resolution_time && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Resolved at: {new Date(selectedAlert.resolution_time).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            {selectedAlert.status === AlertStatus.NEW && (
              <Button 
                color="primary" 
                onClick={() => handleUpdateStatus(selectedAlert.alert_id, AlertStatus.ACKNOWLEDGED)}
                startIcon={<CheckCircleIcon />}
              >
                Acknowledge
              </Button>
            )}
            {selectedAlert.status === AlertStatus.ACKNOWLEDGED && (
              <Button 
                color="primary" 
                onClick={() => handleUpdateStatus(selectedAlert.alert_id, AlertStatus.IN_PROGRESS)}
                startIcon={<CheckCircleIcon />}
              >
                Start Working
              </Button>
            )}
            {(selectedAlert.status === AlertStatus.ACKNOWLEDGED || selectedAlert.status === AlertStatus.IN_PROGRESS) && (
              <Button 
                color="success" 
                onClick={() => handleUpdateStatus(selectedAlert.alert_id, AlertStatus.RESOLVED, "Issue resolved")}
                startIcon={<CheckCircleIcon />}
              >
                Mark Resolved
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Alerts;
