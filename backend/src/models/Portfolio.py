from typing import Optional, List
from datetime import datetime

class Portfolio:
    @staticmethod
    def create(conn, user_id: int, name: str):
        """Create a new portfolio"""
        query = """
            INSERT INTO portfolios (user_id, name)
            VALUES (%s, %s)
            RETURNING *;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (user_id, name))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'user_id': row[1],
                    'name': row[2],
                    'created_at': row[3],
                    'updated_at': row[4]
                }
        return None
    
    @staticmethod
    def find_by_id(conn, portfolio_id: int):
        """Find portfolio by ID"""
        query = "SELECT * FROM portfolios WHERE id = %s"
        with conn.cursor() as cursor:
            cursor.execute(query, (portfolio_id,))
            row = cursor.fetchone()
            
            if row:
                return {
                    'id': row[0],
                    'user_id': row[1],
                    'name': row[2],
                    'created_at': row[3],
                    'updated_at': row[4]
                }
        return None
    
    @staticmethod
    def find_by_user_id(conn, user_id: int):
        """Find all portfolios for a user"""
        query = "SELECT * FROM portfolios WHERE user_id = %s ORDER BY created_at DESC"
        with conn.cursor() as cursor:
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            
            return [{
                'id': row[0],
                'user_id': row[1],
                'name': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            } for row in rows]
    
    @staticmethod
    def update(conn, portfolio_id: int, name: str):
        """Update portfolio name"""
        query = """
            UPDATE portfolios
            SET name = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING *;
        """
        with conn.cursor() as cursor:
            cursor.execute(query, (name, portfolio_id))
            row = cursor.fetchone()
            conn.commit()
            
            if row:
                return {
                    'id': row[0],
                    'user_id': row[1],
                    'name': row[2],
                    'created_at': row[3],
                    'updated_at': row[4]
                }
        return None
    
    @staticmethod
    def delete(conn, portfolio_id: int):
        """Delete a portfolio"""
        query = "DELETE FROM portfolios WHERE id = %s"
        with conn.cursor() as cursor:
            cursor.execute(query, (portfolio_id,))
            conn.commit()
