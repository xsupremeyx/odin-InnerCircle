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
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            is_member BOOLEAN NOT NULL DEFAULT FALSE
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

    // Users
    await client.query(
        `INSERT INTO users (username, password, is_admin, is_member) VALUES
        ('Admin', $1, TRUE, TRUE),
        ('Yash', $1, TRUE, TRUE);`,
        [hashedPassword]
    );

    // Messages (random split between Admin = 1 and Yash = 2)
    await client.query(`
        INSERT INTO messages (title, content, user_id) VALUES

        ('Welcome to the Circle',
        'This is a private space.\nOnly members see everything.\nWhat''s said here, stays here.',
        1),

        ('What is Inner Circle?',
        'Inner Circle is a minimal, members-only message board.\nBuilt to explore privacy, identity, and controlled access.\nNo noise. Just intentional sharing.',
        2),

        ('How visibility works',
        'Not everyone sees the same thing.\n\n• Members see authors\n• Others see anonymity\n\nSame message. Different reality.',
        1),

        ('How to use this space',
        'Once you''re in, you can post messages, edit your own, or delete them.\nKeep it clean. Keep it meaningful.\nThis isn''t a feed — it''s a board.',
        2),

        ('Want to join the Circle?',
        'Membership isn''t public.\n\nIf you''re here, you''re close.\nReach out directly to get access.',
        1),

        ('Get access',
        'To join, contact the creator.\n\nGitHub: https://github.com/xsupremeyx\nOr message directly.\n\nAccess is granted, not requested.',
        2),

        ('One rule',
        'Respect the space.\nThat''s all.',
        1);
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