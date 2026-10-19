const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

async function seed() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true
  });
  
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../../database/schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../../../database/seed.sql'), 'utf8');
    
    await connection.query(schemaSql);
    await connection.query(seedSql);
    console.log('Database seeded successfully');
  } catch (err) {
    console.error('Error seeding DB', err);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}
seed();
