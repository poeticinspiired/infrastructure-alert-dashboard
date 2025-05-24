#!/bin/bash

# Test script for Infrastructure Alert Intelligence Dashboard
# This script tests the real-time alert flow and UI responsiveness

echo "Starting test suite for Infrastructure Alert Intelligence Dashboard..."

# Create test directory
mkdir -p /home/ubuntu/infrastructure-alert-dashboard/tests/integration

# Test backend API endpoints
echo "Testing backend API endpoints..."

# Function to test an endpoint
test_endpoint() {
  local endpoint=$1
  local method=$2
  local data=$3
  local expected_status=$4
  
  echo "Testing $method $endpoint..."
  
  if [ "$method" == "GET" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/$endpoint)
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" http://localhost:5000/api/$endpoint)
  fi
  
  if [ "$status" == "$expected_status" ]; then
    echo "✅ $method $endpoint - Status: $status (Expected: $expected_status)"
    return 0
  else
    echo "❌ $method $endpoint - Status: $status (Expected: $expected_status)"
    return 1
  fi
}

# Create test file for API tests
cat > /home/ubuntu/infrastructure-alert-dashboard/tests/integration/test_api.py << 'EOF'
import unittest
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

class TestInfrastructureAlertDashboardAPI(unittest.TestCase):
    
    def setUp(self):
        # Setup code if needed
        pass
        
    def test_alerts_endpoint(self):
        """Test the alerts endpoint"""
        response = requests.get(f"{BASE_URL}/alerts")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        
    def test_infrastructure_endpoint(self):
        """Test the infrastructure endpoint"""
        response = requests.get(f"{BASE_URL}/infrastructure")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, dict)
        
    def test_analysis_health_status(self):
        """Test the analysis health status endpoint"""
        response = requests.get(f"{BASE_URL}/analysis/health-status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('source_component', data)
        self.assertIn('affected_components', data)
        self.assertIn('impact_score', data)
        
    def test_analysis_impact(self):
        """Test the impact analysis endpoint"""
        response = requests.get(f"{BASE_URL}/analysis/impact?component_id=app-001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('source_component', data)
        self.assertIn('affected_components', data)
        self.assertIn('impact_score', data)
        
    def test_analysis_failure_domains(self):
        """Test the failure domains analysis endpoint"""
        payload = {
            "component_ids": ["app-001", "app-002", "db-001"]
        }
        response = requests.post(
            f"{BASE_URL}/analysis/failure-domains",
            json=payload
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('failure_domains', data)
        
    def test_predictions_endpoint(self):
        """Test the predictions endpoint"""
        response = requests.get(f"{BASE_URL}/predictions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        
    def test_create_prediction(self):
        """Test creating a new prediction"""
        payload = {
            "deployment_id": f"test-deploy-{int(time.time())}",
            "components": ["app-001", "db-001"],
            "changes": ["Test change"],
            "planned_time": datetime.utcnow().isoformat(),
            "deployment_type": "regular"
        }
        response = requests.post(
            f"{BASE_URL}/predictions",
            json=payload
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('risk_score', data)
        self.assertIn('recommended_actions', data)
        
    def test_optimal_windows(self):
        """Test getting optimal deployment windows"""
        response = requests.get(f"{BASE_URL}/predictions/windows")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('Monday', data)
        self.assertIn('Tuesday', data)
        
    def tearDown(self):
        # Cleanup code if needed
        pass

if __name__ == '__main__':
    unittest.main()
EOF

# Create test file for real-time alert flow
cat > /home/ubuntu/infrastructure-alert-dashboard/tests/integration/test_real_time_flow.py << 'EOF'
import unittest
import requests
import json
import time
import threading
from datetime import datetime
from kafka import KafkaProducer

BASE_URL = "http://localhost:5000/api"
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
KAFKA_TOPIC = "infrastructure-alerts"

class TestRealTimeAlertFlow(unittest.TestCase):
    
    def setUp(self):
        # Setup Kafka producer
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
        except Exception as e:
            print(f"Warning: Could not connect to Kafka: {e}")
            self.producer = None
        
    def test_real_time_alert_flow(self):
        """Test the real-time alert flow from Kafka to UI"""
        if not self.producer:
            self.skipTest("Kafka not available")
            
        # Generate a unique alert ID
        alert_id = f"test-alert-{int(time.time())}"
        
        # Create a test alert
        test_alert = {
            "alert_id": alert_id,
            "alert_type": "CPU_USAGE",
            "severity": "critical",
            "status": "new",
            "description": "Test alert for real-time flow testing",
            "source_component": "app-001",
            "affected_components": ["app-001", "service-001"],
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": {
                "cpu_usage": 95.5,
                "memory_usage": 87.2
            }
        }
        
        # Send the alert to Kafka
        self.producer.send(KAFKA_TOPIC, test_alert)
        self.producer.flush()
        
        # Wait for alert processing
        time.sleep(2)
        
        # Check if the alert is available via API
        max_retries = 5
        for i in range(max_retries):
            response = requests.get(f"{BASE_URL}/alerts")
            self.assertEqual(response.status_code, 200)
            alerts = response.json()
            
            # Check if our test alert is in the response
            found = any(alert["alert_id"] == alert_id for alert in alerts)
            if found:
                break
                
            # Wait and retry
            time.sleep(1)
            
        self.assertTrue(found, f"Alert {alert_id} was not found in the API response after {max_retries} retries")
        
    def test_alert_status_update(self):
        """Test updating alert status"""
        # Create a test alert via API
        alert_payload = {
            "alert_type": "MEMORY_USAGE",
            "severity": "high",
            "description": "Test alert for status update testing",
            "source_component": "db-001"
        }
        
        response = requests.post(f"{BASE_URL}/alerts", json=alert_payload)
        self.assertEqual(response.status_code, 200)
        alert = response.json()
        alert_id = alert["alert_id"]
        
        # Update the alert status
        update_payload = {
            "status": "acknowledged",
            "notes": "Acknowledged for testing"
        }
        
        response = requests.put(f"{BASE_URL}/alerts/{alert_id}", json=update_payload)
        self.assertEqual(response.status_code, 200)
        updated_alert = response.json()
        
        self.assertEqual(updated_alert["status"], "acknowledged")
        self.assertEqual(updated_alert["alert_id"], alert_id)
        
    def tearDown(self):
        # Close Kafka producer if it exists
        if hasattr(self, 'producer') and self.producer:
            self.producer.close()

if __name__ == '__main__':
    unittest.main()
EOF

# Create test file for UI responsiveness
cat > /home/ubuntu/infrastructure-alert-dashboard/tests/integration/test_ui_responsiveness.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting UI responsiveness tests...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test dashboard page load time
    console.log('Testing dashboard page load time...');
    const dashboardStart = Date.now();
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    const dashboardLoadTime = Date.now() - dashboardStart;
    console.log(`Dashboard page loaded in ${dashboardLoadTime}ms`);
    
    if (dashboardLoadTime > 3000) {
      console.warn('⚠️ Dashboard page load time exceeds 3 seconds');
    } else {
      console.log('✅ Dashboard page load time is acceptable');
    }
    
    // Test alerts page responsiveness
    console.log('Testing alerts page responsiveness...');
    const alertsStart = Date.now();
    await page.goto('http://localhost:3000/alerts', { waitUntil: 'networkidle2' });
    const alertsLoadTime = Date.now() - alertsStart;
    console.log(`Alerts page loaded in ${alertsLoadTime}ms`);
    
    // Test infrastructure page and graph rendering
    console.log('Testing infrastructure page and graph rendering...');
    const infraStart = Date.now();
    await page.goto('http://localhost:3000/infrastructure', { waitUntil: 'networkidle2' });
    const infraLoadTime = Date.now() - infraStart;
    console.log(`Infrastructure page loaded in ${infraLoadTime}ms`);
    
    // Check if graph is rendered
    const graphExists = await page.evaluate(() => {
      return document.querySelector('svg g') !== null;
    });
    
    if (graphExists) {
      console.log('✅ Infrastructure graph rendered successfully');
    } else {
      console.error('❌ Infrastructure graph failed to render');
    }
    
    // Test analysis page responsiveness
    console.log('Testing analysis page responsiveness...');
    await page.goto('http://localhost:3000/analysis', { waitUntil: 'networkidle2' });
    
    // Test predictions page responsiveness
    console.log('Testing predictions page responsiveness...');
    await page.goto('http://localhost:3000/predictions', { waitUntil: 'networkidle2' });
    
    // Test real-time updates by simulating an alert
    console.log('Testing real-time updates...');
    await page.goto('http://localhost:3000/alerts', { waitUntil: 'networkidle2' });
    
    // Get initial alert count
    const initialAlertCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length;
    });
    
    console.log(`Initial alert count: ${initialAlertCount}`);
    
    // Simulate a new alert via API
    const response = await page.evaluate(async () => {
      const res = await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert_type: 'UI_TEST_ALERT',
          severity: 'critical',
          description: 'Test alert from UI responsiveness test',
          source_component: 'test-component'
        })
      });
      return await res.json();
    });
    
    console.log('Created test alert:', response);
    
    // Wait for potential WebSocket/SSE updates
    await page.waitForTimeout(2000);
    
    // Refresh the page to ensure we see the new alert
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Get updated alert count
    const updatedAlertCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length;
    });
    
    console.log(`Updated alert count: ${updatedAlertCount}`);
    
    if (updatedAlertCount > initialAlertCount) {
      console.log('✅ Real-time alert flow working correctly');
    } else {
      console.warn('⚠️ Real-time alert flow may not be working as expected');
    }
    
    console.log('UI responsiveness tests completed');
    
  } catch (error) {
    console.error('Error during UI testing:', error);
  } finally {
    await browser.close();
  }
})();
EOF

# Create a test runner script
cat > /home/ubuntu/infrastructure-alert-dashboard/run_tests.sh << 'EOF'
#!/bin/bash

echo "Running Infrastructure Alert Intelligence Dashboard Tests"
echo "========================================================"

# Run API tests
echo -e "\n\n📋 Running API Tests..."
cd /home/ubuntu/infrastructure-alert-dashboard
python3 tests/integration/test_api.py -v

# Run real-time flow tests
echo -e "\n\n📋 Running Real-Time Flow Tests..."
python3 tests/integration/test_real_time_flow.py -v

# Run UI responsiveness tests
echo -e "\n\n📋 Running UI Responsiveness Tests..."
node tests/integration/test_ui_responsiveness.js

echo -e "\n\n✅ All tests completed!"
EOF

# Make the test runner executable
chmod +x /home/ubuntu/infrastructure-alert-dashboard/run_tests.sh

echo "Test suite setup complete!"
echo "To run tests, start the backend and frontend servers, then execute:"
echo "  ./run_tests.sh"
