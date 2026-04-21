const pool = require('./pool');

async function getAllMessages(){
    const SQL = `SELECT messages.*, users.username 
        FROM messages
        JOIN users ON messages.user_id = users.id
        ORDER BY messages.created_at DESC;
    `;
    const { rows } = await pool.query(SQL);
    return rows;
}

module.exports = {
    getAllMessages,
}