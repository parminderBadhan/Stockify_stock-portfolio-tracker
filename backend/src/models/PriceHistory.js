const pool = require('../config/database');

class PriceHistory {
  static async create(symbol, price, volume = 0) {
    const query = `
      INSERT INTO price_history (symbol, price, volume, date)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [symbol, price, volume]);
    return result.rows[0];
  }

  static async findBySymbol(symbol, limit = 100) {
    const query = `
      SELECT * FROM price_history
      WHERE symbol = $1
      ORDER BY date DESC
      LIMIT $2;
    `;
    const result = await pool.query(query, [symbol, limit]);
    return result.rows.reverse(); // oldest first for charting
  }

  static async findBySymbolAndDateRange(symbol, startDate, endDate) {
    const query = `
      SELECT * FROM price_history
      WHERE symbol = $1 AND date BETWEEN $2 AND $3
      ORDER BY date ASC;
    `;
    const result = await pool.query(query, [symbol, startDate, endDate]);
    return result.rows;
  }

  static async getLatestPrice(symbol) {
    const query = `
      SELECT * FROM price_history
      WHERE symbol = $1
      ORDER BY date DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [symbol]);
    return result.rows[0];
  }
}

module.exports = PriceHistory;
