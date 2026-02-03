from typing import Optional, List

class Alert:
    @staticmethod
    def create(conn, portfolio_id: int, symbol: str, price_threshold: float, condition: str, email: str):
        """Create a new alert"""
        query = """
            INSERT INTO alerts (portfolio_id, symbol, price_threshold, condition, email, is_active)
            VALUES (%s, %s, %s, %s, %s, true)
            RETURNING *;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (portfolio_id, symbol, price_threshold, condition, email))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'portfolio_id': row[1],
                    'symbol': row[2],
                    'price_threshold': float(row[3]),
                    'condition': row[4],
                    'email': row[5],
                    'is_active': row[6],
                    'created_at': row[7],
                    'updated_at': row[8]
                }
        return None
    
    @staticmethod
    def find_by_portfolio_id(conn, portfolio_id: int):
        """Find all active alerts for a portfolio"""
        query = "SELECT * FROM alerts WHERE portfolio_id = %s AND is_active = true ORDER BY created_at DESC"
        with conn.cursor() as cursor:
            cursor.execute(query, (portfolio_id,))
            rows = cursor.fetchall()
            
            return [{
                'id': row[0],
                'portfolio_id': row[1],
                'symbol': row[2],
                'price_threshold': float(row[3]),
                'condition': row[4],
                'email': row[5],
                'is_active': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            } for row in rows]
    
    @staticmethod
    def find_active(conn):
        """Find all active alerts"""
        query = "SELECT * FROM alerts WHERE is_active = true"
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            return [{
                'id': row[0],
                'portfolio_id': row[1],
                'symbol': row[2],
                'price_threshold': float(row[3]),
                'condition': row[4],
                'email': row[5],
                'is_active': row[6],
                'created_at': row[7],
                'updated_at': row[8]
            } for row in rows]
    
    @staticmethod
    def find_by_id(conn, alert_id: int):
        """Find alert by ID"""
        query = "SELECT * FROM alerts WHERE id = %s"
        with conn.cursor() as cursor:
            cursor.execute(query, (alert_id,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'id': row[0],
                    'portfolio_id': row[1],
                    'symbol': row[2],
                    'price_threshold': float(row[3]),
                    'condition': row[4],
                    'email': row[5],
                    'is_active': row[6],
                    'created_at': row[7],
                    'updated_at': row[8]
                }
        return None
    
    @staticmethod
    def deactivate(conn, alert_id: int):
        """Deactivate an alert"""
        query = "UPDATE alerts SET is_active = false WHERE id = %s RETURNING *"
        with conn.cursor() as cursor:
            cursor.execute(query, (alert_id,))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'portfolio_id': row[1],
                    'symbol': row[2],
                    'price_threshold': float(row[3]),
                    'condition': row[4],
                    'email': row[5],
                    'is_active': row[6],
                    'created_at': row[7],
                    'updated_at': row[8]
                }
        return None
    
    @staticmethod
    def delete(conn, alert_id: int):
        """Delete an alert"""
        query = "DELETE FROM alerts WHERE id = %s"
        with conn.cursor() as cursor:
            cursor.execute(query, (alert_id,))
            conn.commit()
