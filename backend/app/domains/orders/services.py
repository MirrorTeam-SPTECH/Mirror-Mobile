import random
import string

VALID_TRANSITIONS: dict[str, list[str]] = {
    "pending_payment": ["paid", "cancelled"],
    "paid":            ["preparing", "cancelled"],
    "preparing":       ["ready", "cancelled"],
    "ready":           ["delivered", "cancelled"],
    "delivered":       [],
    "cancelled":       [],
}


def generate_pickup_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def validate_status_transition(current: str, new_status: str) -> bool:
    return new_status in VALID_TRANSITIONS.get(current, [])
