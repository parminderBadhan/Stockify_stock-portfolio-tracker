from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..config.database import get_db
from ..models.Alert import Alert

router = APIRouter()

class CreateAlertRequest(BaseModel):
    portfolioId: int
    symbol: str
    priceThreshold: float
    condition: str
    email: str

@router.post("")
async def create_alert(request: CreateAlertRequest, conn=Depends(get_db)):
    """Create a new alert"""
    try:
        alert = Alert.create(
            conn,
            request.portfolioId,
            request.symbol,
            request.priceThreshold,
            request.condition,
            request.email
        )
        return alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}")
async def get_alerts(portfolio_id: int, conn=Depends(get_db)):
    """Get all active alerts for a portfolio"""
    try:
        alerts = Alert.find_by_portfolio_id(conn, portfolio_id)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{alert_id}/deactivate")
async def deactivate_alert(alert_id: int, conn=Depends(get_db)):
    """Deactivate an alert"""
    try:
        alert = Alert.deactivate(conn, alert_id)
        return alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, conn=Depends(get_db)):
    """Delete an alert"""
    try:
        Alert.delete(conn, alert_id)
        return {"message": "Alert deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
