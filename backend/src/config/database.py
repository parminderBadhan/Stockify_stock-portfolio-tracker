import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import pool

load_dotenv()

class Database:
    def __init__(self):
        self.connection_pool = None
    
    def connect(self):
        """Initialize connection pool"""
        try:
            database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/stock_portfolio_db')
            
            self.connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 20,
                database_url
            )
            
            if self.connection_pool:
                print("Database connection pool created successfully")
        except Exception as e:
            print(f"Error creating connection pool: {e}")
            raise e
    
    def get_connection(self):
        """Get connection from pool"""
        if not self.connection_pool:
            self.connect()
        return self.connection_pool.getconn()
    
    def return_connection(self, conn):
        """Return connection to pool"""
        if self.connection_pool and conn:
            self.connection_pool.putconn(conn)
    
    def close_all(self):
        """Close all connections"""
        if self.connection_pool:
            self.connection_pool.closeall()
            print("Database connection pool closed")

# Singleton instance
db = Database()

def get_db():
    """Dependency for FastAPI routes"""
    conn = db.get_connection()
    try:
        yield conn
    finally:
        db.return_connection(conn)
