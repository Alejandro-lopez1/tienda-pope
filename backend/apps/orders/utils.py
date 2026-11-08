import re
import secrets

from django.utils import timezone


def normalize_phone(phone: str | None) -> str:
    """Normalize a phone number to a canonical digit string.

    Rules (MVP, AR-friendly): keep digits only. If the result starts with '00',
    drop the leading '00'. If it starts with a single leading '0' (local
    formatting), drop it. Returns an empty string for missing/empty input.
    """
    if not phone:
        return ""
    digits = re.sub(r"\D", "", str(phone))
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) > 10 and digits.startswith("0"):
        digits = digits[1:]
    return digits


def generate_order_number() -> str:
    """Generate a candidate order number.

    Uniqueness is enforced by the DB; callers creating under concurrency should
    retry on IntegrityError.
    """
    today = timezone.localdate().strftime("%Y%m%d")
    suffix = secrets.token_hex(2).upper()  # 4 chars, adds entropy under races
    return f"ORD-{today}-{suffix}"

