const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    try {
      const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
      const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
      if (dbUrlLine) {
        dbUrl = dbUrlLine.split('DATABASE_URL=')[1].trim();
      }
    } catch (e) {
      console.warn('Could not read .env.local file');
    }
  }

  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('Migration executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
