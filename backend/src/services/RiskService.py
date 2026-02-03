import json
import math
from typing import List, Dict
from ..services.StockService import get_stock_service
from ..models.PriceHistory import PriceHistory
from ..config.redis import get_redis

class RiskService:
    def __init__(self):
        self.stock_service = get_stock_service()
        self.redis = get_redis()
    
    async def calculate_portfolio_value(self, conn, holdings: List[Dict]) -> Dict:
        """Calculate portfolio P&L and value"""
        if not holdings or len(holdings) == 0:
            return {
                'totalValue': 0,
                'totalCostBasis': 0,
                'totalPnL': 0,
                'totalPnLPercent': 0,
                'holdings': []
            }
        
        total_value = 0
        total_cost_basis = 0
        updated_holdings = []
        
        for holding in holdings:
            cost_basis = float(holding['quantity']) * float(holding['purchase_price'])
            
            try:
                current_price_data = await self.stock_service.get_stock_price(holding['symbol'], conn)
                current_price = current_price_data['price']
                current_value = float(holding['quantity']) * current_price
                pnl = current_value - cost_basis
                pnl_percent = (pnl / cost_basis) * 100 if cost_basis > 0 else 0
                
                updated_holdings.append({
                    **holding,
                    'currentPrice': current_price,
                    'currentValue': current_value,
                    'costBasis': cost_basis,
                    'pnl': pnl,
                    'pnlPercent': pnl_percent,
                    'allocation': 0,  # Will be calculated after total is known
                    'priceError': False
                })
                
                total_value += current_value
                total_cost_basis += cost_basis
                
            except Exception as e:
                print(f'Error calculating value for {holding["symbol"]}: {e}')
                
                # Fallback: Show holding with cost basis but no current price
                updated_holdings.append({
                    **holding,
                    'currentPrice': None,
                    'currentValue': None,
                    'costBasis': cost_basis,
                    'pnl': None,
                    'pnlPercent': None,
                    'allocation': 0,
                    'priceError': True,
                    'errorMessage': 'Price unavailable'
                })
                
                total_cost_basis += cost_basis
        
        # Calculate allocation percentages
        for holding in updated_holdings:
            if holding.get('currentValue') and total_value > 0:
                holding['allocation'] = (holding['currentValue'] / total_value) * 100
        
        total_pnl = total_value - total_cost_basis
        total_pnl_percent = (total_pnl / total_cost_basis) * 100 if total_cost_basis > 0 else 0
        
        return {
            'totalValue': round(total_value, 2),
            'totalCostBasis': round(total_cost_basis, 2),
            'totalPnL': round(total_pnl, 2),
            'totalPnLPercent': round(total_pnl_percent, 2),
            'holdings': updated_holdings
        }
    
    async def calculate_portfolio_beta(self, conn, holdings: List[Dict]) -> float:
        """Calculate portfolio beta (weighted average)"""
        try:
            cache_key = 'portfolio:beta'
            cached = self.redis.get(cache_key)
            if cached:
                return float(json.loads(cached))
            
            total_beta = 0
            total_value = 0
            
            portfolio_value = await self.calculate_portfolio_value(conn, holdings)
            
            for holding in portfolio_value['holdings']:
                if holding.get('currentValue'):
                    beta = await self.stock_service.get_stock_beta(holding['symbol'])
                    weight = holding['currentValue'] / portfolio_value['totalValue']
                    total_beta += float(beta) * weight
                    total_value += holding['currentValue']
            
            portfolio_beta = round(total_beta, 2)
            
            # Cache for 24 hours
            self.redis.setex(cache_key, 86400, json.dumps(portfolio_beta))
            
            return portfolio_beta
        except Exception as e:
            print(f'Error calculating portfolio beta: {e}')
            raise e
    
    async def calculate_value_at_risk(self, conn, holdings: List[Dict], confidence_level: float = 0.95) -> Dict:
        """Calculate Value at Risk (VaR) at 95% confidence level"""
        try:
            cache_key = f'portfolio:var:{confidence_level}'
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            portfolio_value = await self.calculate_portfolio_value(conn, holdings)
            
            if portfolio_value['totalValue'] == 0:
                return {
                    'var95': 0,
                    'varPercent': 0
                }
            
            # Calculate returns variance from historical data
            total_variance = 0
            count = 0
            
            for holding in holdings:
                try:
                    price_history = PriceHistory.find_by_symbol(conn, holding['symbol'], 60)
                    
                    if len(price_history) > 1:
                        returns = []
                        for i in range(1, len(price_history)):
                            daily_return = (price_history[i]['price'] - price_history[i-1]['price']) / price_history[i-1]['price']
                            returns.append(daily_return)
                        
                        if len(returns) > 0:
                            mean = sum(returns) / len(returns)
                            variance = sum((r - mean) ** 2 for r in returns) / len(returns)
                            
                            latest_price = price_history[-1]['price'] if price_history else 0
                            weight = holding['quantity'] * latest_price / portfolio_value['totalValue']
                            
                            total_variance += variance * weight
                            count += 1
                except Exception as e:
                    print(f'Error calculating VaR for {holding["symbol"]}: {e}')
            
            # Standard deviation of portfolio
            portfolio_std_dev = math.sqrt(total_variance) if total_variance > 0 else 0
            
            # Z-score for 95% confidence (one-tailed)
            z_score = 1.645
            
            # VaR = Portfolio Value × Z-score × Std Dev
            var95 = portfolio_value['totalValue'] * z_score * portfolio_std_dev
            var_percent = (var95 / portfolio_value['totalValue']) * 100 if portfolio_value['totalValue'] > 0 else 0
            
            result = {
                'var95': round(var95, 2),
                'varPercent': round(var_percent, 2)
            }
            
            # Cache for 24 hours
            self.redis.setex(cache_key, 86400, json.dumps(result))
            
            return result
        except Exception as e:
            print(f'Error calculating VaR: {e}')
            raise e
    
    async def analyze_sector_concentration(self, conn, holdings: List[Dict]) -> Dict:
        """Analyze sector concentration"""
        try:
            cache_key = 'portfolio:sectors'
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            sector_map = {
                # Technology
                'AAPL': 'Technology',
                'MSFT': 'Technology',
                'GOOGL': 'Technology',
                'META': 'Technology',
                'NVDA': 'Technology',
                # Finance
                'JPM': 'Finance',
                'BAC': 'Finance',
                'GS': 'Finance',
                # Healthcare
                'JNJ': 'Healthcare',
                'UNH': 'Healthcare',
                'PFE': 'Healthcare',
                # Consumer
                'AMZN': 'Consumer',
                'WMT': 'Consumer',
                'KO': 'Consumer',
                # Energy
                'XOM': 'Energy',
                'CVX': 'Energy',
                # Industrial
                'BA': 'Industrial',
                'CAT': 'Industrial',
                # Auto
                'TSLA': 'Auto',
            }
            
            portfolio_value = await self.calculate_portfolio_value(conn, holdings)
            sector_concentration = {}
            
            for holding in portfolio_value['holdings']:
                if holding.get('currentValue'):
                    sector = sector_map.get(holding['symbol'], 'Other')
                    if sector not in sector_concentration:
                        sector_concentration[sector] = {
                            'value': 0,
                            'percent': 0,
                            'stocks': []
                        }
                    sector_concentration[sector]['value'] += holding['currentValue']
                    sector_concentration[sector]['stocks'].append(holding['symbol'])
            
            # Calculate percentages
            for sector in sector_concentration:
                sector_concentration[sector]['percent'] = round(
                    (sector_concentration[sector]['value'] / portfolio_value['totalValue']) * 100, 2
                )
            
            # Cache for 24 hours
            self.redis.setex(cache_key, 86400, json.dumps(sector_concentration))
            
            return sector_concentration
        except Exception as e:
            print(f'Error analyzing sector concentration: {e}')
            raise e

# Singleton instance
risk_service = RiskService()

def get_risk_service() -> RiskService:
    """Get risk service instance"""
    return risk_service
