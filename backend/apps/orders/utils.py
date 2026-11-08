import re


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
