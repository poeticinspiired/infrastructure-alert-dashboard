#!/bin/bash

# Script to make the test scripts executable

echo "Making test scripts executable..."
chmod +x /home/ubuntu/infrastructure-alert-dashboard/tests/setup_tests.sh
chmod +x /home/ubuntu/infrastructure-alert-dashboard/tests/execute_tests.sh
chmod +x /home/ubuntu/infrastructure-alert-dashboard/run_tests.sh

echo "Done!"
