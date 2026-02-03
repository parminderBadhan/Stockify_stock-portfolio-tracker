import asyncio
from datetime import datetime
from typing import Dict
from ..models.Alert import Alert
from ..services.StockService import get_stock_service
from ..config.email import get_email_service
from ..config.database import db

class AlertService:
    def __init__(self):
        self.email_service = get_email_service()
        self.stock_service = get_stock_service()
        self.is_monitoring = False
        self.monitoring_task = None
    
    async def send_alert(self, alert: Dict, current_price: float):
        """Send price alert email"""
        try:
            message = f"""
                <h2>Price Alert Triggered!</h2>
                <p><strong>Stock Symbol:</strong> {alert['symbol']}</p>
                <p><strong>Current Price:</strong> ${current_price:.2f}</p>
                <p><strong>Threshold:</strong> {alert['condition']} ${alert['price_threshold']:.2f}</p>
                <p><strong>Triggered at:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            """
            
            self.email_service.send_email(
                alert['email'],
                f"Price Alert: {alert['symbol']} {alert['condition']} ${alert['price_threshold']}",
                message
            )
            
            print(f"Alert sent to {alert['email']} for {alert['symbol']}")
        except Exception as e:
            print(f'Error sending alert email: {e}')
    
    async def check_alerts(self):
        """Check all active alerts"""
        try:
            conn = db.get_connection()
            try:
                active_alerts = Alert.find_active(conn)
                
                if len(active_alerts) == 0:
                    return
                
                # Group by symbol to minimize API calls
                alerts_by_symbol = {}
                for alert in active_alerts:
                    symbol = alert['symbol']
                    if symbol not in alerts_by_symbol:
                        alerts_by_symbol[symbol] = []
                    alerts_by_symbol[symbol].append(alert)
                
                # Check each symbol
                for symbol, alerts in alerts_by_symbol.items():
                    try:
                        stock_data = await self.stock_service.get_stock_price(symbol, conn)
                        current_price = stock_data['price']
                        
                        # Check each alert for this symbol
                        for alert in alerts:
                            condition_met = (
                                (alert['condition'] == 'above' and current_price > alert['price_threshold']) or
                                (alert['condition'] == 'below' and current_price < alert['price_threshold'])
                            )
                            
                            if condition_met:
                                await self.send_alert(alert, current_price)
                                # Deactivate alert after sending (optional)
                                # Alert.deactivate(conn, alert['id'])
                    except Exception as e:
                        print(f'Error checking alerts for {symbol}: {e}')
            finally:
                db.return_connection(conn)
        except Exception as e:
            print(f'Error in alert check: {e}')
    
    async def monitoring_loop(self, interval_seconds: int = 60):
        """Monitoring loop for alerts"""
        while self.is_monitoring:
            await self.check_alerts()
            await asyncio.sleep(interval_seconds)
    
    def start_monitoring(self, interval_ms: int = 60000):
        """Start alert monitoring"""
        if self.is_monitoring:
            print('Alert monitoring already running')
            return
        
        self.is_monitoring = True
        interval_seconds = interval_ms / 1000
        print(f'Starting alert monitoring every {interval_ms}ms')
        
        # Create monitoring task
        self.monitoring_task = asyncio.create_task(self.monitoring_loop(interval_seconds))
    
    def stop_monitoring(self):
        """Stop alert monitoring"""
        if self.monitoring_task:
            self.is_monitoring = False
            self.monitoring_task.cancel()
            print('Alert monitoring stopped')

# Singleton instance
alert_service = AlertService()

def get_alert_service() -> AlertService:
    """Get alert service instance"""
    return alert_service
