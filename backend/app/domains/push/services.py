"""
Business logic for push notifications.

Expo Push Notifications + geolocation + payday logic.
"""


class PushService:
    """Service for push notification operations"""

    @staticmethod
    def send_proximity_alert(user_id: int):
        """
        Send push when user is near food truck.

        Uses geolocation + user preferences.
        """
        # TODO: Implement Expo Push
        pass

    @staticmethod
    def send_payday_suggestion(user_id: int):
        """
        Send "lanche de sempre" suggestion on payday week.

        Uses order history + date logic.
        """
        # TODO: Implement
        pass

    @staticmethod
    def send_order_status_update(order_id: int, new_status: str):
        """
        Send push notification when order status changes.
        """
        # TODO: Implement
        pass
