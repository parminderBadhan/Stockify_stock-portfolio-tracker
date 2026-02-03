from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..config.database import get_db
from ..models.Holding import Holding

router = APIRouter()

class AddHoldingRequest(BaseModel):
    portfolioId: int
    symbol: str
    quantity: float
    purchasePrice: float

class UpdateHoldingRequest(BaseModel):
    quantity: float
    purchasePrice: float

@router.post("")
async def add_holding(request: AddHoldingRequest, conn=Depends(get_db)):
    """Add a new holding"""
    try:
        if not all([request.portfolioId, request.symbol, request.quantity, request.purchasePrice]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        holding = Holding.create(
            conn,
            request.portfolioId,
            request.symbol,
            request.quantity,
            request.purchasePrice
        )
        return holding
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}")
async def get_holdings(portfolio_id: int, conn=Depends(get_db)):
    """Get all holdings for a portfolio"""
    try:
        holdings = Holding.find_by_portfolio_id(conn, portfolio_id)
        return holdings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{holding_id}")
async def update_holding(holding_id: int, request: UpdateHoldingRequest, conn=Depends(get_db)):
    """Update a holding"""
    try:
        holding = Holding.update(conn, holding_id, request.quantity, request.purchasePrice)
        return holding
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{holding_id}")
async def delete_holding(holding_id: int, conn=Depends(get_db)):
    """Delete a holding"""
    try:
        Holding.delete(conn, holding_id)
        return {"message": "Holding deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
