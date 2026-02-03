from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from ..config.database import get_db
from ..services.StockService import get_stock_service

router = APIRouter()
stock_service = get_stock_service()

@router.get("/{symbol}")
async def get_stock_price(symbol: str, conn=Depends(get_db)):
    """Get current stock price"""
    try:
        price_data = await stock_service.get_stock_price(symbol, conn)
        return price_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/history")
async def get_price_history(symbol: str, limit: int = Query(default=100), conn=Depends(get_db)):
    """Get price history for a symbol"""
    try:
        history = stock_service.get_price_history(conn, symbol, limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/history/range")
async def get_price_history_range(
    symbol: str,
    startDate: str = Query(...),
    endDate: str = Query(...),
    conn=Depends(get_db)
):
    """Get price history for a symbol within a date range"""
    try:
        from ..models.PriceHistory import PriceHistory
        
        start = datetime.fromisoformat(startDate)
        end = datetime.fromisoformat(endDate)
        
        history = PriceHistory.find_by_symbol_and_date_range(conn, symbol, start, end)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
