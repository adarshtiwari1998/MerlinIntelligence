
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require("@shared/schema");

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: true
});

const db = drizzle(pool, { schema });

module.exports = { db, pool };
