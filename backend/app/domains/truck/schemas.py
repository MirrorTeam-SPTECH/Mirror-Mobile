from pydantic import BaseModel
from typing import Optional


class TruckStatusResponse(BaseModel):
    open: bool
    closes_at: Optional[str] = None   # "23:00" when open
    opens_today: bool = False         # True when closed but opens later today
    next_weekday: Optional[int] = None  # 0=Mon…6=Sun, when closed and not today
