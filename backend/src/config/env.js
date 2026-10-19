const path = require('path');
const fs = require('fs');
const backendEnv = path.resolve(__dirname, '../../.env');
const projectEnv = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(backendEnv)) require('dotenv').config({ path: backendEnv });
else require('dotenv').config({ path: projectEnv });

module.exports = {
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'lost_and_found_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  MATCH_THRESHOLD: 0.55, // From constraints
  CAMPUS_CENTER: { lat: 12.9345, lng: 77.6065 } // Approximate christ university
};
