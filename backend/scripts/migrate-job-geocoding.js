// Script to run SQL migrations for the job geocoding feature
// Run with: node scripts/migrate-job-geocoding.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Running job geocoding migration...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'add_job_geocoding_fields.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL:', sql);

    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());

        // For ALTER TABLE statements, we need to use a different approach
        // Let's try using the Supabase client's direct SQL execution
        const { error } = await supabase.from('jobs').select('*').limit(1); // Just to test connection

        if (error) {
          console.error('Database connection error:', error);
          process.exit(1);
        }

        // Since we can't execute DDL directly, we'll need to run this in Supabase dashboard
        console.log('⚠️  DDL statements need to be run manually in Supabase SQL Editor');
        console.log('Please run the following SQL in your Supabase project:');
        console.log('---');
        console.log(sql);
        console.log('---');
        break;
      }
    }

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runMigration();