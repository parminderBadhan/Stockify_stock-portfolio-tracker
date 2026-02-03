import os
import json
import httpx
import random
from datetime import datetime
from typing import List, Dict
from dotenv import load_dotenv
from ..config.redis import get_redis
from ..config.database import get_db
from ..models.PriceHistory import PriceHistory

load_dotenv()

class StockService:
    def __init__(self):
        self.api_key = os.getenv('ALPHA_VANTAGE_API_KEY', '')
        self.base_url = 'https://www.alphavantage.co/query'
        self.update_interval = int(os.getenv('STOCK_UPDATE_INTERVAL', '30000'))
        self.redis = get_redis()
    
    async def get_stock_price(self, symbol: str, conn=None) -> Dict:
        """Get current stock price"""
        try:
            # Check cache first
            cached_price = self.redis.get(f'stock:{symbol}')
            if cached_price:
                return json.loads(cached_price)
            
            # Fetch from Alpha Vantage
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        'function': 'GLOBAL_QUOTE',
                        'symbol': symbol,
                        'apikey': self.api_key
                    }
                )
                data = response.json()
            
            quote_data = data.get('Global Quote', {})
            if not quote_data or '05. price' not in quote_data:
                raise Exception(f'Invalid response for symbol {symbol}')
            
            price = float(quote_data['05. price'])
            volume = int(quote_data.get('06. volume', 0))
            change = float(quote_data.get('09. change', 0))
            change_percent_str = quote_data.get('10. change percent', '0%').replace('%', '')
            change_percent = float(change_percent_str)
            
            price_data = {
                'symbol': symbol,
                'price': price,
                'volume': volume,
                'change': change,
                'changePercent': change_percent,
                'timestamp': datetime.now().isoformat()
            }
            
            # Cache for 5 minutes
            self.redis.setex(f'stock:{symbol}', 300, json.dumps(price_data))
            
            # Save to database
            if conn:
                PriceHistory.create(conn, symbol, price, volume)
            
            return price_data
            
        except Exception as e:
            print(f'Error fetching price for {symbol}: {e}')
            
            # DEVELOPMENT FALLBACK: Return mock prices
            mock_prices = {
                'AAPL': 245.50,
                'TSLA': 425.75,
                'GOOGL': 175.30,
                'MSFT': 420.10,
                'AMZN': 185.60,
                'META': 512.25,
            }
            
            base_price = mock_prices.get(symbol.upper(), 100)
            # Add small random variation to simulate price changes
            variation = (random.random() - 0.5) * 5
            price = round(base_price + variation, 2)
            
            price_data = {
                'symbol': symbol,
                'price': price,
                'volume': 1000000,
                'change': variation,
                'changePercent': round((variation / base_price) * 100, 2),
                'timestamp': datetime.now().isoformat(),
                'isMock': True
            }
            
            print(f'Using mock price for {symbol}: ${price}')
            
            # Cache mock price for 1 minute
            self.redis.setex(f'stock:{symbol}', 60, json.dumps(price_data))
            
            return price_data
    
    async def get_multiple_prices(self, symbols: List[str], conn=None) -> List[Dict]:
        """Get prices for multiple symbols"""
        results = []
        for symbol in symbols:
            price_data = await self.get_stock_price(symbol, conn)
            results.append(price_data)
        return results
    
    def get_price_history(self, conn, symbol: str, limit: int = 100) -> List[Dict]:
        """Get price history for a symbol"""
        try:
            return PriceHistory.find_by_symbol(conn, symbol, limit)
        except Exception as e:
            print(f'Error getting price history for {symbol}: {e}')
            raise e
    
    async def get_stock_beta(self, symbol: str) -> float:
        """Get stock beta (simplified)"""
        try:
            cache_key = f'beta:{symbol}'
            cached = self.redis.get(cache_key)
            if cached:
                return float(json.loads(cached))
            
            # In production, calculate beta from historical returns
            # Beta is covariance(stock, market) / variance(market)
            # For demo, use mock data
            beta = round(random.random() * 0.8 + 0.6, 2)  # Beta between 0.6-1.4
            
            self.redis.setex(cache_key, 86400, json.dumps(beta))  # Cache 24 hours
            
            return beta
        except Exception as e:
            print(f'Error calculating beta for {symbol}: {e}')
            raise e

# Singleton instance
stock_service = StockService()

def get_stock_service() -> StockService:
    """Get stock service instance"""
    return stock_service
