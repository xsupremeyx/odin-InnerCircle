const { Client } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');


const URL = process.argv[2] || process.env.DATABASE_URL;

async function resetTables(client){
    console.log('Dropping existing tables...');
    await client.query(`
        DROP TABLE IF EXISTS messages;
        DROP TABLE IF EXISTS users;
    `);
    console.log('Tables dropped.');
}

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

async function seedData(client){
    console.log('Seeding data...');

    const hashedPassword = await bcrypt.hash(process.env.POPULATEPASS, 10);

    await client.query(
        `INSERT INTO users (username, password) VALUES
        ('alice', $1),
        ('bob', $1),
        ('charlie', $1);`,
        [hashedPassword]
    );

    await client.query(`
        INSERT INTO messages (title, content, user_id) VALUES
        ('Welcome', 'Hello from Alice', 1),
        ('Second Post', 'Bob here', 2),
        ('Hidden Identity', 'Guess who?', 3),
        ('Another One', 'Alice again', 1);
    `);

    console.log('Data seeded.');
}

async function main(){
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: URL,
    });

    try {
        await client.connect();
        console.log('Connected to database successfully.');
        await resetTables(client);
        await createTables(client);
        await seedData(client);
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