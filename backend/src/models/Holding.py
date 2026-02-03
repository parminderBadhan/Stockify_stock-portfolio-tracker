from typing import Optional, List
from decimal import Decimal

class Holding:
    @staticmethod
    def create(conn, portfolio_id: int, symbol: str, quantity: float, purchase_price: float):
        """Create a new holding"""
        query = """
            INSERT INTO holdings (portfolio_id, symbol, quantity, purchase_price, purchase_date)
            VALUES (%s, %s, %s, %s, NOW())
            RETURNING *;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (portfolio_id, symbol, quantity, purchase_price))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'portfolio_id': row[1],
                    'symbol': row[2],
                    'quantity': float(row[3]),
                    'purchase_price': float(row[4]),
                    'purchase_date': row[5],
                    'created_at': row[6],
                    'updated_at': row[7]
                }
        return None
    
    @staticmethod
    def find_by_portfolio_id(conn, portfolio_id: int):
        """Find all holdings for a portfolio"""
        query = "SELECT * FROM holdings WHERE portfolio_id = %s ORDER BY created_at DESC"
        with conn.cursor() as cursor:
            cursor.execute(query, (portfolio_id,))
            rows = cursor.fetchall()
            
            return [{
                'id': row[0],
                'portfolio_id': row[1],
                'symbol': row[2],
                'quantity': float(row[3]),
                'purchase_price': float(row[4]),
                'purchase_date': row[5],
                'created_at': row[6],
                'updated_at': row[7]
            } for row in rows]
    
    @staticmethod
    def find_by_id(conn, holding_id: int):
        """Find holding by ID"""
        query = "SELECT * FROM holdings WHERE id = %s"
        with conn.cursor() as cursor:
            cursor.execute(query, (holding_id,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'id': row[0],
                    'portfolio_id': row[1],
                    'symbol': row[2],
                    'quantity': float(row[3]),
                    'purchase_price': float(row[4]),
                    'purchase_date': row[5],
                    'created_at': row[6],
                    'updated_at': row[7]
                }
        return None
    
    @staticmethod
    def update(conn, holding_id: int, quantity: float, purchase_price: float):
        """Update holding"""
        query = """
            UPDATE holdings
            SET quantity = %s, purchase_price = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING *;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (quantity, purchase_price, holding_id))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'portfolio_id': row[1],
                    'symbol': row[2],
                    'quantity': float(row[3]),
                    'purchase_price': float(row[4]),
                    'purchase_date': row[5],
                    'created_at': row[6],
                    'updated_at': row[7]
                }
        return None
    
    @staticmethod
    def delete(conn, holding_id: int):
        """Delete a holding"""
        query = "DELETE FROM holdings WHERE id = %s"
        with conn.cursor() as cursor:
            cursor.execute(query, (holding_id,))
            conn.commit()
