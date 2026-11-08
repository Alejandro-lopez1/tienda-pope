from datetime import datetime

from django.db.models import Count, Max, Min, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.orders.utils import normalize_phone

from .exports import CustomerExportBuilder
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ViewSet):
    """Clientes derivados de órdenes, agrupados por teléfono normalizado."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def _customer_groups(self, qs=None):
        qs = qs if qs is not None else Order.objects.all()
        groups = {}
        for o in qs.order_by("created_at").iterator():
            key = normalize_phone(o.customer_phone) or (o.customer_phone or "").strip()
            if not key:
                continue
            g = groups.get(key)
            if g is None:
                g = {
                    "customer_phone": key,
                    "customer_name": o.customer_name or "",
                    "customer_address": o.customer_address or "",
                    "total_orders": 0,
                    "total_spent": 0.0,
                    "paid_orders": 0,
                    "pending_orders": 0,
                    "first_order_date": o.created_at,
                    "last_order_date": o.created_at,
                }
                groups[key] = g
            g["total_orders"] += 1
            g["total_spent"] += float(o.total or 0)
            if o.paid:
                g["paid_orders"] += 1
            if o.status == "pending":
                g["pending_orders"] += 1
            if o.created_at:
                if not g["first_order_date"] or o.created_at < g["first_order_date"]:
                    g["first_order_date"] = o.created_at
                if not g["last_order_date"] or o.created_at > g["last_order_date"]:
                    g["last_order_date"] = o.created_at
                    g["customer_name"] = o.customer_name or g["customer_name"]
                    g["customer_address"] = o.customer_address or g["customer_address"]

        result = []
        for g in groups.values():
            count = g["total_orders"] or 1
            g["avg_order_value"] = g["total_spent"] / count
            result.append(g)
        return result

    def _filter_groups(self, groups, search_query, ordering):
        if search_query:
            q = search_query.lower()
            groups = [
                g
                for g in groups
                if q in (g.get("customer_name") or "").lower()
                or q in (g.get("customer_phone") or "").lower()
                or q in (g.get("customer_address") or "").lower()
            ]

        key_map = {
            "-total_spent": (lambda g: g["total_spent"], True),
            "total_spent": (lambda g: g["total_spent"], False),
            "-total_orders": (lambda g: g["total_orders"], True),
            "total_orders": (lambda g: g["total_orders"], False),
            "customer_name": (lambda g: (g.get("customer_name") or "").lower(), False),
            "-last_order_date": (lambda g: g.get("last_order_date") or datetime.min.replace(tzinfo=timezone.utc), True),
        }
        fn, rev = key_map.get(ordering, key_map["-total_spent"])
        groups.sort(key=fn, reverse=rev)
        return groups

    def list(self, request):
        search_query = request.query_params.get("search", "")
        ordering = request.query_params.get("ordering", "-total_spent")
        page = int(request.query_params.get("page", 1) or 1)
        page_size = 10

        groups = self._filter_groups(self._customer_groups(), search_query, ordering)
        total_count = len(groups)
        start = (page - 1) * page_size
        end = start + page_size
        page_data = groups[start:end]

        serializer = CustomerSerializer(page_data, many=True)
        return Response(
            {
                "count": total_count,
                "next": f"/api/v1/customers/?page={page + 1}" if end < total_count else None,
                "previous": f"/api/v1/customers/?page={page - 1}" if page > 1 else None,
                "results": serializer.data,
            }
        )

    @action(detail=False, methods=["get"])
    def summary(self, request):
        groups = self._customer_groups()
        total_customers = len(groups)
        total_revenue = sum(g["total_spent"] for g in groups)
        order_count = Order.objects.count()
        avg_order_value = total_revenue / order_count if order_count > 0 else 0

        this_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        phones_this_month = set()
        for o in Order.objects.filter(created_at__gte=this_month).only("customer_phone").iterator():
            p = normalize_phone(o.customer_phone)
            if p:
                phones_this_month.add(p)
        customers_this_month = len(phones_this_month)
        repeat_customers = sum(1 for g in groups if g["total_orders"] > 1)

        return Response(
            {
                "total_customers": total_customers,
                "total_revenue": total_revenue,
                "avg_order_value": avg_order_value,
                "customers_this_month": customers_this_month,
                "repeat_customers": repeat_customers,
            }
        )

    @action(detail=False, methods=["get"])
    def top_customers(self, request):
        limit = int(request.query_params.get("limit", 10) or 10)
        groups = self._filter_groups(self._customer_groups(), "", "-total_spent")[:limit]
        data = [
            {
                "customer_phone": g["customer_phone"],
                "customer_name": g["customer_name"],
                "total_orders": g["total_orders"],
                "total_spent": g["total_spent"],
            }
            for g in groups
        ]
        return Response(data)

    @action(detail=False, methods=["get"])
    def by_phone(self, request):
        phone = normalize_phone(request.query_params.get("phone", ""))
        if not phone:
            return Response({"error": "Parámetro phone requerido"}, status=status.HTTP_400_BAD_REQUEST)

        groups = [g for g in self._customer_groups() if g["customer_phone"] == phone]
        if not groups:
            return Response({"error": "Cliente no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(groups[0])

    @action(detail=False, methods=["get"], url_path="orders")
    def orders_by_phone(self, request):
        phone = normalize_phone(request.query_params.get("phone", ""))
        if not phone:
            return Response({"error": "Parámetro phone requerido"}, status=status.HTTP_400_BAD_REQUEST)

        matched = []
        for o in Order.objects.order_by("-created_at").prefetch_related("items", "items__product"):
            if normalize_phone(o.customer_phone) == phone:
                matched.append(o)
        serializer = OrderSerializer(matched, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def export(self, request):
        fmt = (request.query_params.get("format") or "xlsx").lower()
        qs = Order.objects.all()

        status_f = request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        paid_f = request.query_params.get("paid")
        if paid_f in ("true", "false", "1", "0"):
            qs = qs.filter(paid=paid_f in ("true", "1"))

        # filter by phone/search if provided
        phone_f = normalize_phone(request.query_params.get("phone", ""))
        search_f = (request.query_params.get("search") or "").strip().lower()

        builder = CustomerExportBuilder(qs)
        if phone_f or search_f:
            filtered = []
            for o in builder.orders:
                key = normalize_phone(o.customer_phone)
                if phone_f and key != phone_f:
                    continue
                if search_f:
                    blob = f"{o.customer_name} {o.customer_phone} {o.customer_address}".lower()
                    if search_f not in blob:
                        continue
                filtered.append(o)
            builder.orders = filtered

        stamp = timezone.now().strftime("%Y%m%d")
        if fmt == "csv":
            content = builder.to_csv_text()
            resp = HttpResponse(content, content_type="text/csv; charset=utf-8")
            resp["Content-Disposition"] = f'attachment; filename="clientes_detalle_{stamp}.csv"'
            # BOM for Excel friendliness
            resp.content = ("\ufeff" + content).encode("utf-8")
            return resp

        buf = builder.to_xlsx()
        resp = HttpResponse(
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        resp["Content-Disposition"] = f'attachment; filename="clientes_detalle_{stamp}.xlsx"'
        return resp
