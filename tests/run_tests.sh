#!/bin/bash

# Script to execute tests for the Infrastructure Alert Intelligence Dashboard

# Create results directory
mkdir -p /home/ubuntu/infrastructure-alert-dashboard/tests/results

# Get current timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="/home/ubuntu/infrastructure-alert-dashboard/tests/results/test_execution_$TIMESTAMP.md"

echo "# Infrastructure Alert Intelligence Dashboard Test Execution" > $RESULTS_FILE
echo "**Date:** $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo "## Test Execution Summary" >> $RESULTS_FILE

# Check if backend server is running
echo "Checking if backend server is running..." | tee -a $RESULTS_FILE
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  echo "✅ Backend server is running" | tee -a $RESULTS_FILE
  BACKEND_RUNNING=true
else
  echo "❌ Backend server is not running. Please start it before running tests." | tee -a $RESULTS_FILE
  BACKEND_RUNNING=false
fi

# Check if frontend server is running
echo "Checking if frontend server is running..." | tee -a $RESULTS_FILE
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend server is running" | tee -a $RESULTS_FILE
  FRONTEND_RUNNING=true
else
  echo "❌ Frontend server is not running. Please start it before running tests." | tee -a $RESULTS_FILE
  FRONTEND_RUNNING=false
fi

# If servers are not running, provide instructions
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
  echo "" >> $RESULTS_FILE
  echo "## Server Start Instructions" >> $RESULTS_FILE
  echo "To start the servers, run the following commands:" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  echo "### Backend Server" >> $RESULTS_FILE
  echo "```bash" >> $RESULTS_FILE
  echo "cd /home/ubuntu/infrastructure-alert-dashboard/backend" >> $RESULTS_FILE
  echo "python3 -m flask run --host=0.0.0.0" >> $RESULTS_FILE
  echo "```" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  echo "### Frontend Server" >> $RESULTS_FILE
  echo "```bash" >> $RESULTS_FILE
  echo "cd /home/ubuntu/infrastructure-alert-dashboard/frontend" >> $RESULTS_FILE
  echo "npm start" >> $RESULTS_FILE
  echo "```" >> $RESULTS_FILE
  
  echo "Please start the servers and run this script again."
  exit 1
fi

# Run API tests
echo "" >> $RESULTS_FILE
echo "## API Tests" >> $RESULTS_FILE
echo "Running API tests..." | tee -a $RESULTS_FILE
cd /home/ubuntu/infrastructure-alert-dashboard
python3 -m unittest tests/integration/test_api.py 2>&1 | tee -a $RESULTS_FILE
API_TEST_STATUS=${PIPESTATUS[0]}

if [ $API_TEST_STATUS -eq 0 ]; then
  echo "✅ API tests passed" | tee -a $RESULTS_FILE
else
  echo "❌ API tests failed" | tee -a $RESULTS_FILE
fi

# Run real-time flow tests
echo "" >> $RESULTS_FILE
echo "## Real-Time Flow Tests" >> $RESULTS_FILE
echo "Running real-time flow tests..." | tee -a $RESULTS_FILE
python3 -m unittest tests/integration/test_real_time_flow.py 2>&1 | tee -a $RESULTS_FILE
REALTIME_TEST_STATUS=${PIPESTATUS[0]}

if [ $REALTIME_TEST_STATUS -eq 0 ]; then
  echo "✅ Real-time flow tests passed" | tee -a $RESULTS_FILE
else
  echo "❌ Real-time flow tests failed" | tee -a $RESULTS_FILE
fi

# Run UI responsiveness tests
echo "" >> $RESULTS_FILE
echo "## UI Responsiveness Tests" >> $RESULTS_FILE
echo "Running UI responsiveness tests..." | tee -a $RESULTS_FILE
node tests/integration/test_ui_responsiveness.js 2>&1 | tee -a $RESULTS_FILE
UI_TEST_STATUS=${PIPESTATUS[0]}

if [ $UI_TEST_STATUS -eq 0 ]; then
  echo "✅ UI responsiveness tests passed" | tee -a $RESULTS_FILE
else
  echo "❌ UI responsiveness tests failed" | tee -a $RESULTS_FILE
fi

# Calculate overall test status
OVERALL_STATUS=0
if [ $API_TEST_STATUS -ne 0 ] || [ $REALTIME_TEST_STATUS -ne 0 ] || [ $UI_TEST_STATUS -ne 0 ]; then
  OVERALL_STATUS=1
fi

# Add overall test summary
echo "" >> $RESULTS_FILE
echo "## Overall Test Summary" >> $RESULTS_FILE
echo "- **API Tests:** $([ $API_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" >> $RESULTS_FILE
echo "- **Real-Time Flow Tests:** $([ $REALTIME_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" >> $RESULTS_FILE
echo "- **UI Responsiveness Tests:** $([ $UI_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" >> $RESULTS_FILE
echo "- **Overall Status:** $([ $OVERALL_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")" >> $RESULTS_FILE

echo "" >> $RESULTS_FILE
echo "Test execution completed. Results saved to: $RESULTS_FILE"

# Create a symlink to the latest results
ln -sf $RESULTS_FILE /home/ubuntu/infrastructure-alert-dashboard/tests/results/latest_results.md

echo "Test execution script completed."
