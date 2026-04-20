const { Client } = require('pg');
require('dotenv').config();

const URL = process.argv[2] || process.env.DATABASE_URL;

async function createTables(client){
    console.log('Creating tables...');
    const SQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            title VARCHAR(100) NOT NULL,
            content VARCHAR(500) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            user_id INT NOT NULL,
            CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

    `;
    await client.query(SQL);
    console.log('Tables created successfully.');
}

async function main(){
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: URL,
    });

    try {
        await client.connect();
        console.log('Connected to database successfully.');

        await createTables(client);

    }
    catch (err) {
        console.error('Error populating database:', err);
    }
    finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

main();