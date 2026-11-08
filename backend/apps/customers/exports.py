import csv
from io import BytesIO, StringIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from apps.orders.models import Order
from apps.orders.utils import normalize_phone


class CustomerExportBuilder:
    """Build master-detail customer exports (XLSX/CSV) from Order data.

    Master = customer (keyed by normalized phone).
    Detail = orders and their items.
    """

    HEADERS = [
        "cliente_tel",
        "cliente_nombre",
        "cliente_direccion",
        "cliente_cant_pedidos",
        "cliente_total_gastado",
        "pedido_numero",
        "pedido_fecha",
        "pedido_estado",
        "pedido_pagado",
        "pedido_total",
        "producto",
        "cantidad",
        "precio_unit",
        "subtotal_item",
        "descuento_item",
        "total_item",
    ]

    def __init__(self, orders_qs=None):
        qs = orders_qs if orders_qs is not None else Order.objects.all()
        self.orders = list(
            qs.prefetch_related("items", "items__product").order_by(
                "customer_phone", "-created_at"
            )
        )

    def _customer_stats(self):
        stats = {}
        for o in self.orders:
            key = normalize_phone(o.customer_phone) or (o.customer_phone or "").strip()
            if key not in stats:
                stats[key] = {"count": 0, "total": 0}
            stats[key]["count"] += 1
            stats[key]["total"] += float(o.total or 0)
        return stats

    def iter_rows(self):
        stats = self._customer_stats()
        for o in self.orders:
            key = normalize_phone(o.customer_phone) or (o.customer_phone or "").strip()
            c = stats.get(key, {"count": 0, "total": 0})
            base = [
                key,
                o.customer_name or "",
                o.customer_address or "",
                c["count"],
                f"{c['total']:.2f}",
                o.order_number,
                o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
                o.get_status_display(),
                "Si" if o.paid else "No",
                f"{float(o.total or 0):.2f}",
            ]
            items = list(o.items.all())
            if not items:
                yield base + ["", "", "", "", "", ""]
            else:
                for it in items:
                    name = getattr(it.product, "name", "") if it.product_id else ""
                    yield base + [
                        name,
                        it.quantity,
                        f"{float(it.price or 0):.2f}",
                        f"{float(it.subtotal):.2f}",
                        f"{float(it.discount_amount):.2f}",
                        f"{float(it.total):.2f}",
                    ]

    def to_xlsx(self) -> BytesIO:
        wb = Workbook()
        ws = wb.active
        ws.title = "Clientes-Detalle"

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill("solid", fgColor="2C3E50")
        for col, title in enumerate(self.HEADERS, 1):
            cell = ws.cell(row=1, column=col, value=title)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for row in self.iter_rows():
            ws.append(row)

        for col, title in enumerate(self.HEADERS, 1):
            max_len = len(str(title))
            for cell in ws[get_column_letter(col)]:
                if cell.value is not None:
                    max_len = max(max_len, min(len(str(cell.value)), 40))
            ws.column_dimensions[get_column_letter(col)].width = max_len + 2

        ws.freeze_panes = "A2"
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf

    def to_csv_text(self) -> str:
        sio = StringIO()
        writer = csv.writer(sio)
        writer.writerow(self.HEADERS)
        for row in self.iter_rows():
            writer.writerow(row)
        return sio.getvalue()
