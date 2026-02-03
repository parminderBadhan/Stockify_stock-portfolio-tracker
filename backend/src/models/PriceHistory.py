from typing import Optional, List
from datetime import datetime

class PriceHistory:
    @staticmethod
    def create(conn, symbol: str, price: float, volume: int = 0):
        """Create a new price history record"""
        query = """
            INSERT INTO price_history (symbol, price, volume, date)
            VALUES (%s, %s, %s, NOW())
            RETURNING *;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (symbol, price, volume))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'symbol': row[1],
                    'price': float(row[2]),
                    'volume': row[3],
                    'date': row[4]
                }
        return None
    
    @staticmethod
    def find_by_symbol(conn, symbol: str, limit: int = 100):
        """Find price history by symbol"""
        query = """
            SELECT * FROM price_history
            WHERE symbol = %s
            ORDER BY date DESC
            LIMIT %s;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (symbol, limit))
            rows = cursor.fetchall()
            
            # Reverse to get oldest first for charting
            results = [{
                'id': row[0],
                'symbol': row[1],
                'price': float(row[2]),
                'volume': row[3],
                'date': row[4]
            } for row in rows]
            
            return list(reversed(results))
    
    @staticmethod
    def find_by_symbol_and_date_range(conn, symbol: str, start_date: datetime, end_date: datetime):
        """Find price history by symbol and date range"""
        query = """
            SELECT * FROM price_history
            WHERE symbol = %s AND date BETWEEN %s AND %s
            ORDER BY date ASC;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (symbol, start_date, end_date))
            rows = cursor.fetchall()
            
            return [{
                'id': row[0],
                'symbol': row[1],
                'price': float(row[2]),
                'volume': row[3],
                'date': row[4]
            } for row in rows]
    
    @staticmethod
    def get_latest_price(conn, symbol: str):
        """Get latest price for a symbol"""
        query = """
            SELECT * FROM price_history
            WHERE symbol = %s
            ORDER BY date DESC
            LIMIT 1;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (symbol,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'id': row[0],
                    'symbol': row[1],
                    'price': float(row[2]),
                    'volume': row[3],
                    'date': row[4]
                }
        return None
