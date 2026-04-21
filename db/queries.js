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

async function insertMessage(title, content, user_id){
    await pool.query(
        "INSERT INTO messages (title, content, user_id) VALUES ($1, $2, $3)",
        [title, content, user_id] 
    );
}

async function getMessageById(id){
    const SQL = `
        SELECT messages.*, users.username
        FROM messages
        JOIN users ON messages.user_id = users.id
        WHERE messages.id = $1;
    `;
    const { rows } = await pool.query(SQL, [id]);
    if(rows.length === 0) return null;
    return rows[0];
}

async function updateMessage(id, title, content){
    await pool.query(
        "UPDATE messages SET title = $1, content = $2 WHERE id = $3",
        [title, content, id]
    );
}

module.exports = {
    getAllMessages,
    insertMessage,
    getMessageById,
    updateMessage,
}