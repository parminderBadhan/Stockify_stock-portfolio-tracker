import os
import sys
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def create_tables():
    """Create database tables and indexes"""
    try:
        print("Creating database tables...")
        
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/stock_portfolio_db')
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Portfolios table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolios (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ portfolios table created")
        
        # Holdings table
        cursor.execute("""
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
        """)
        print("✓ holdings table created")
        
        # Price History table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(10) NOT NULL,
                price DECIMAL(18, 4) NOT NULL,
                volume BIGINT DEFAULT 0,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✓ price_history table created")
        
        # Alerts table
        cursor.execute("""
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
        """)
        print("✓ alerts table created")
        
        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolios(user_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_holding_portfolio ON holdings(portfolio_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_holding_symbol ON holdings(symbol);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_price_symbol ON price_history(symbol);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_price_date ON price_history(date);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_portfolio ON alerts(portfolio_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_active ON alerts(is_active);
        """)
        print("✓ indexes created")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("Database initialization completed successfully!")
        return 0
    except Exception as error:
        print(f"Error creating tables: {error}")
        return 1

if __name__ == "__main__":
    sys.exit(create_tables())
