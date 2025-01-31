#!/bin/bash

# Navigate to project folder
cd "${DEPLOYMENT_TARGET}"

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the application
echo "Starting application..."
npm start