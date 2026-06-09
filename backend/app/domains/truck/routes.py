from datetime import datetime, timezone, timedelta

from fastapi import APIRouter

from app.domains.truck.schemas import TruckStatusResponse

router = APIRouter()

# Brasil aboliu horário de verão em 2019 — UTC-3 é fixo para SP
_SP = timezone(timedelta(hours=-3))
_OPEN_DAYS = {1, 2, 3, 4, 5, 6}  # Ter=1 … Dom=6 (Seg=0 fechado)
_OPEN_HOUR = 11
_CLOSE_HOUR = 23


@router.get("/truck/status", response_model=TruckStatusResponse)
def get_truck_status():
    now = datetime.now(_SP)
    weekday = now.weekday()  # 0=Seg … 6=Dom
    hour = now.hour

    is_open = weekday in _OPEN_DAYS and _OPEN_HOUR <= hour < _CLOSE_HOUR

    if is_open:
        return TruckStatusResponse(open=True, closes_at=f"{_CLOSE_HOUR}:00")

    # Fecha mais tarde hoje (antes das 11h num dia de abertura)
    if weekday in _OPEN_DAYS and hour < _OPEN_HOUR:
        return TruckStatusResponse(open=False, opens_today=True)

    # Encontra o próximo dia de abertura
    days_ahead = 1
    while True:
        next_wd = (weekday + days_ahead) % 7
        if next_wd in _OPEN_DAYS:
            return TruckStatusResponse(open=False, opens_today=False, next_weekday=next_wd)
        days_ahead += 1
