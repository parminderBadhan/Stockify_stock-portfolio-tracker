const pool = require('../config/database');

class Holding {
  static async create(portfolioId, symbol, quantity, purchasePrice) {
    const query = `
      INSERT INTO holdings (portfolio_id, symbol, quantity, purchase_price, purchase_date)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [portfolioId, symbol, quantity, purchasePrice]);
    return result.rows[0];
  }

  static async findByPortfolioId(portfolioId) {
    const query = 'SELECT * FROM holdings WHERE portfolio_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [portfolioId]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM holdings WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, quantity, purchasePrice) {
    const query = `
      UPDATE holdings
      SET quantity = $1, purchase_price = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const result = await pool.query(query, [quantity, purchasePrice, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM holdings WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Holding;
