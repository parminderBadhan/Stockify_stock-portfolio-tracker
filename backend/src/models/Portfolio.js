const pool = require('../config/database');

class Portfolio {
  static async create(userId, name) {
    const query = `
      INSERT INTO portfolios (user_id, name)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, name]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM portfolios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async update(id, name) {
    const query = `
      UPDATE portfolios
      SET name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM portfolios WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Portfolio;
