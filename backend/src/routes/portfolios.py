from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..config.database import get_db
from ..models.Portfolio import Portfolio
from ..models.Holding import Holding
from ..services.RiskService import get_risk_service

router = APIRouter()
risk_service = get_risk_service()

class CreatePortfolioRequest(BaseModel):
    name: str

class UpdatePortfolioRequest(BaseModel):
    name: str

@router.post("")
async def create_portfolio(request: CreatePortfolioRequest, conn=Depends(get_db)):
    """Create a new portfolio"""
    try:
        user_id = 1  # Simplified - in production, get from auth token
        
        if not request.name:
            raise HTTPException(status_code=400, detail="Portfolio name is required")
        
        portfolio = Portfolio.create(conn, user_id, request.name)
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def get_portfolios(conn=Depends(get_db)):
    """Get all portfolios for user"""
    try:
        user_id = 1  # Simplified
        portfolios = Portfolio.find_by_user_id(conn, user_id)
        return portfolios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}")
async def get_portfolio(portfolio_id: int, conn=Depends(get_db)):
    """Get portfolio by ID"""
    try:
        portfolio = Portfolio.find_by_id(conn, portfolio_id)
        
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        holdings = Holding.find_by_portfolio_id(conn, portfolio_id)
        portfolio_value = await risk_service.calculate_portfolio_value(conn, holdings)
        
        return {
            **portfolio,
            **portfolio_value
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}/analytics")
async def get_portfolio_with_analytics(portfolio_id: int, conn=Depends(get_db)):
    """Get portfolio with full analytics"""
    try:
        portfolio = Portfolio.find_by_id(conn, portfolio_id)
        
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        holdings = Holding.find_by_portfolio_id(conn, portfolio_id)
        portfolio_value = await risk_service.calculate_portfolio_value(conn, holdings)
        beta = await risk_service.calculate_portfolio_beta(conn, holdings)
        var_data = await risk_service.calculate_value_at_risk(conn, holdings)
        sectors = await risk_service.analyze_sector_concentration(conn, holdings)
        
        return {
            **portfolio,
            **portfolio_value,
            'beta': beta,
            **var_data,
            'sectors': sectors
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{portfolio_id}")
async def update_portfolio(portfolio_id: int, request: UpdatePortfolioRequest, conn=Depends(get_db)):
    """Update portfolio"""
    try:
        portfolio = Portfolio.update(conn, portfolio_id, request.name)
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{portfolio_id}")
async def delete_portfolio(portfolio_id: int, conn=Depends(get_db)):
    """Delete portfolio"""
    try:
        Portfolio.delete(conn, portfolio_id)
        return {"message": "Portfolio deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
