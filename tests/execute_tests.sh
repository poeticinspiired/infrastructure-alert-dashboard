#!/bin/bash

# Script to execute tests and document results for Infrastructure Alert Intelligence Dashboard

echo "Starting test execution and documentation..."
echo "============================================"

# Create results directory
RESULTS_DIR="/home/ubuntu/infrastructure-alert-dashboard/tests/results"
mkdir -p $RESULTS_DIR

# Get current timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="$RESULTS_DIR/test_results_$TIMESTAMP.md"

# Create results file header
cat > $RESULTS_FILE << EOF
# Infrastructure Alert Intelligence Dashboard Test Results
**Test Date:** $(date)

## Test Environment
- Backend: Flask with Kafka integration
- Frontend: React with TypeScript and D3.js
- Test Tools: Python unittest, Puppeteer

## Test Summary
EOF

# Start backend server for testing (in background)
echo "Starting backend server for testing..."
cd /home/ubuntu/infrastructure-alert-dashboard/backend
python3 -m flask run --host=0.0.0.0 > $RESULTS_DIR/backend_log_$TIMESTAMP.txt 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:5000/api/health > /dev/null; then
  echo "❌ Backend failed to start. Check logs at $RESULTS_DIR/backend_log_$TIMESTAMP.txt"
  echo -e "\n## Test Execution Failed\nBackend server failed to start." >> $RESULTS_FILE
  exit 1
fi

# Start frontend server for testing (in background)
echo "Starting frontend server for testing..."
cd /home/ubuntu/infrastructure-alert-dashboard/frontend
npm start > $RESULTS_DIR/frontend_log_$TIMESTAMP.txt 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to initialize..."
sleep 20

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Frontend failed to start. Check logs at $RESULTS_DIR/frontend_log_$TIMESTAMP.txt"
  echo -e "\n## Test Execution Failed\nFrontend server failed to start." >> $RESULTS_FILE
  
  # Kill backend process
  kill $BACKEND_PID
  exit 1
fi

echo "Both servers started successfully. Beginning tests..."

# Run API tests
echo -e "\n\n📋 Running API Tests..."
cd /home/ubuntu/infrastructure-alert-dashboard
python3 tests/integration/test_api.py -v > $RESULTS_DIR/api_tests_$TIMESTAMP.txt 2>&1
API_TEST_STATUS=$?

# Extract API test results
API_TESTS_PASSED=$(grep -c "ok" $RESULTS_DIR/api_tests_$TIMESTAMP.txt)
API_TESTS_FAILED=$(grep -c "FAIL" $RESULTS_DIR/api_tests_$TIMESTAMP.txt)
API_TESTS_ERRORS=$(grep -c "ERROR" $RESULTS_DIR/api_tests_$TIMESTAMP.txt)

# Add API test results to report
cat >> $RESULTS_FILE << EOF

## API Tests
- **Tests Passed:** $API_TESTS_PASSED
- **Tests Failed:** $API_TESTS_FAILED
- **Test Errors:** $API_TESTS_ERRORS
- **Status:** $([ $API_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

### API Test Details
\`\`\`
$(cat $RESULTS_DIR/api_tests_$TIMESTAMP.txt)
\`\`\`
EOF

# Run real-time flow tests
echo -e "\n\n📋 Running Real-Time Flow Tests..."
python3 tests/integration/test_real_time_flow.py -v > $RESULTS_DIR/realtime_tests_$TIMESTAMP.txt 2>&1
REALTIME_TEST_STATUS=$?

# Extract real-time test results
REALTIME_TESTS_PASSED=$(grep -c "ok" $RESULTS_DIR/realtime_tests_$TIMESTAMP.txt)
REALTIME_TESTS_FAILED=$(grep -c "FAIL" $RESULTS_DIR/realtime_tests_$TIMESTAMP.txt)
REALTIME_TESTS_ERRORS=$(grep -c "ERROR" $RESULTS_DIR/realtime_tests_$TIMESTAMP.txt)

# Add real-time test results to report
cat >> $RESULTS_FILE << EOF

## Real-Time Flow Tests
- **Tests Passed:** $REALTIME_TESTS_PASSED
- **Tests Failed:** $REALTIME_TESTS_FAILED
- **Test Errors:** $REALTIME_TESTS_ERRORS
- **Status:** $([ $REALTIME_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

### Real-Time Flow Test Details
\`\`\`
$(cat $RESULTS_DIR/realtime_tests_$TIMESTAMP.txt)
\`\`\`
EOF

# Run UI responsiveness tests
echo -e "\n\n📋 Running UI Responsiveness Tests..."
node tests/integration/test_ui_responsiveness.js > $RESULTS_DIR/ui_tests_$TIMESTAMP.txt 2>&1
UI_TEST_STATUS=$?

# Add UI test results to report
cat >> $RESULTS_FILE << EOF

## UI Responsiveness Tests
- **Status:** $([ $UI_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

### UI Test Details
\`\`\`
$(cat $RESULTS_DIR/ui_tests_$TIMESTAMP.txt)
\`\`\`
EOF

# Calculate overall test status
OVERALL_STATUS=0
if [ $API_TEST_STATUS -ne 0 ] || [ $REALTIME_TEST_STATUS -ne 0 ] || [ $UI_TEST_STATUS -ne 0 ]; then
  OVERALL_STATUS=1
fi

# Add overall test summary
cat >> $RESULTS_FILE << EOF

## Overall Test Summary
- **API Tests:** $([ $API_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Real-Time Flow Tests:** $([ $REALTIME_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **UI Responsiveness Tests:** $([ $UI_TEST_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Overall Status:** $([ $OVERALL_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

## Issues Identified
EOF

# Extract issues from test logs
grep -i "fail\|error\|warn" $RESULTS_DIR/*_$TIMESTAMP.txt | sort > $RESULTS_DIR/issues_$TIMESTAMP.txt

# Add issues to report
if [ -s $RESULTS_DIR/issues_$TIMESTAMP.txt ]; then
  cat >> $RESULTS_FILE << EOF
The following issues were identified during testing:

\`\`\`
$(cat $RESULTS_DIR/issues_$TIMESTAMP.txt)
\`\`\`
EOF
else
  echo "No issues were identified during testing." >> $RESULTS_FILE
fi

# Add recommendations
cat >> $RESULTS_FILE << EOF

## Recommendations
EOF

if [ $OVERALL_STATUS -eq 0 ]; then
  cat >> $RESULTS_FILE << EOF
All tests passed successfully. The system is ready for validation and deployment.

Recommended next steps:
1. Conduct final user acceptance testing
2. Prepare deployment documentation
3. Schedule production deployment
EOF
else
  cat >> $RESULTS_FILE << EOF
Some tests failed. The following actions are recommended:

1. Address the identified issues
2. Re-run the tests to verify fixes
3. Conduct additional testing for affected components
EOF
fi

# Stop servers
echo "Stopping test servers..."
kill $FRONTEND_PID
kill $BACKEND_PID

echo "Test execution and documentation completed."
echo "Results saved to: $RESULTS_FILE"

# Create a symlink to the latest results
ln -sf $RESULTS_FILE $RESULTS_DIR/latest_results.md

exit $OVERALL_STATUS
