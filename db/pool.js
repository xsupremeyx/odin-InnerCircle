const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

module.exports = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})