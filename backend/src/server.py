import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .config.database import db
from .config.redis import redis_client
from .services.StockService import get_stock_service
from .services.AlertService import get_alert_service
from .routes import portfolios, holdings, stocks, alerts

load_dotenv()

# Background task for price updates
async def price_update_loop():
    """Background task for updating stock prices"""
    stock_service = get_stock_service()
    default_symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
    update_interval = int(os.getenv('STOCK_UPDATE_INTERVAL', '30000')) / 1000  # Convert ms to seconds
    
    print(f'Starting price update loop for {len(default_symbols)} symbols every {update_interval}s')
    
    while True:
        conn = db.get_connection()
        try:
            for symbol in default_symbols:
                try:
                    await stock_service.get_stock_price(symbol, conn)
                    # Rate limit: wait between requests
                    await asyncio.sleep(0.2)
                except Exception as e:
                    print(f'Failed to update price for {symbol}: {e}')
        finally:
            db.return_connection(conn)
        
        await asyncio.sleep(update_interval)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Starting Stock Portfolio Tracker API...")
    
    # Connect to database
    db.connect()
    print("Connected to PostgreSQL")
    
    # Connect to Redis
    redis_client.connect()
    print("Connected to Redis")
    
    # Start background tasks
    price_task = asyncio.create_task(price_update_loop())
    
    # Start alert monitoring
    alert_service = get_alert_service()
    alert_service.start_monitoring(60000)  # Check every minute
    
    yield
    
    # Shutdown
    print("Shutting down...")
    price_task.cancel()
    alert_service.stop_monitoring()
    db.close_all()
    redis_client.close()
    print("Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Stock Portfolio Tracker API",
    description="Real-time stock portfolio tracker with risk analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "OK", "timestamp": asyncio.get_event_loop().time()}

# Include routers
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["portfolios"])
app.include_router(holdings.router, prefix="/api/holdings", tags=["holdings"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])

# 404 handler
@app.get("/{full_path:path}")
async def catch_all():
    return {"error": "Not Found"}, 404

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
