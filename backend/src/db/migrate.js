const pool = require('../config/database');

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Portfolios table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ portfolios table created');

    // Holdings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        quantity DECIMAL(18, 4) NOT NULL,
        purchase_price DECIMAL(18, 4) NOT NULL,
        purchase_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ holdings table created');

    // Price History table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        price DECIMAL(18, 4) NOT NULL,
        volume BIGINT DEFAULT 0,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ price_history table created');

    // Alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        price_threshold DECIMAL(18, 4) NOT NULL,
        condition VARCHAR(10) NOT NULL,
        email VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ alerts table created');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolios(user_id);
      CREATE INDEX IF NOT EXISTS idx_holding_portfolio ON holdings(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_holding_symbol ON holdings(symbol);
      CREATE INDEX IF NOT EXISTS idx_price_symbol ON price_history(symbol);
      CREATE INDEX IF NOT EXISTS idx_price_date ON price_history(date);
      CREATE INDEX IF NOT EXISTS idx_alert_portfolio ON alerts(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_alert_active ON alerts(is_active);
    `);
    console.log('✓ indexes created');

    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
