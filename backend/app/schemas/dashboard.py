from pydantic import BaseModel
from typing import List

class KPICards(BaseModel):
    active_trains: int
    active_incidents: int
    critical_alerts: int
    open_work_orders: int
    ai_recommendations: int
    system_health: float

class AlertItem(BaseModel):
    id: str
    message: str
    location: str
    time_ago: str

class TimelineItem(BaseModel):
    event: str
    status: str
    timestamp: str

class DashboardResponse(BaseModel):
    kpis: KPICards
    critical_alerts: List[AlertItem]
    recent_timeline: List[TimelineItem]
