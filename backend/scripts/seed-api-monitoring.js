/**
 * Seed API Monitoring Dashboard with Realistic Test Data
 * Run this script to populate the API monitoring dashboard with sample data
 * 
 * Usage: node scripts/seed-api-monitoring.js
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function seedApiMonitoringData() {
  console.log('🌱 Seeding API Monitoring Dashboard with realistic test data...');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api-monitoring/seed-test-data`);
    
    console.log('✅ Success!');
    console.log(`📊 Response:`, response.data);
    console.log('\n📈 Dashboard should now show realistic API usage:');
    console.log('  - GitHub API: 450/5000 calls per hour (4550 remaining)');
    console.log('  - LinkedIn API: 45/500 calls per day (455 remaining)');
    console.log('  - NewsAPI: 92/100 calls per day (8 remaining) ⚠️ ALERT');
    console.log('  - Gmail API: 850/10000 calls per 10 min (9150 remaining)');
    console.log('  - Outlook API: 1200/10000 calls per 10 min (8800 remaining)');
    console.log('  - 5 realistic error logs recorded');
    console.log('\n🌐 View the dashboard at your frontend URL (typically http://localhost:5173)');
    console.log('   Login with any user account to see the API Monitoring Dashboard\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.error('\n⚠️  Make sure the backend server is running on', BACKEND_URL);
    process.exit(1);
  }
}

seedApiMonitoringData();