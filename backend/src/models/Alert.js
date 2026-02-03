const pool = require('../config/database');

class Alert {
  static async create(portfolioId, symbol, priceThreshold, condition, email) {
    const query = `
      INSERT INTO alerts (portfolio_id, symbol, price_threshold, condition, email, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *;
    `;
    const result = await pool.query(query, [portfolioId, symbol, priceThreshold, condition, email]);
    return result.rows[0];
  }

  static async findByPortfolioId(portfolioId) {
    const query = 'SELECT * FROM alerts WHERE portfolio_id = $1 AND is_active = true ORDER BY created_at DESC';
    const result = await pool.query(query, [portfolioId]);
    return result.rows;
  }

  static async findActive() {
    const query = 'SELECT * FROM alerts WHERE is_active = true';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM alerts WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deactivate(id) {
    const query = 'UPDATE alerts SET is_active = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM alerts WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Alert;
