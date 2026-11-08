import logging

from django.db import transaction
from django.db.models import F
from django.http import FileResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.products.models import Product

from .models import Order
from .serializers import OrderCreateSerializer, OrderListSerializer, OrderSerializer
from .services import PDFReceiptGenerator, WhatsAppMessageGenerator

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet para pedidos.
    
    Endpoints:
    - POST /api/v1/orders/ - Crear nuevo pedido (anónimo)
    - GET /api/v1/orders/ - Listar pedidos (admin only)
    - GET /api/v1/orders/{id}/ - Detalle de pedido
    - PATCH /api/v1/orders/{id}/ - Actualizar pedido (admin only)
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['order_number', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'total', 'status']
    filterset_fields = ['status', 'payment_method', 'paid']

    def get_serializer_class(self):
        """Usar serializador apropiado según la acción."""
        if self.action == 'list':
            return OrderListSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_permissions(self):
        """Permisos según la acción.

        Público: crear pedido y flujo post-compra (confirmación, PDF, WhatsApp).
        Admin: gestión, listado, estado/pago y datos sensibles agregados.
        """
        if self.action in ['create', 'retrieve', 'generate_pdf', 'send_whatsapp']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_throttles(self):
        if self.action == 'create':
            self.throttle_scope = 'orders_create'
            return [ScopedRateThrottle()]
        if self.action in ['retrieve', 'generate_pdf', 'send_whatsapp']:
            self.throttle_scope = 'orders_public'
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_object(self):
        """Lookup: anónimos solo por order_number; staff puede usar pk numérico."""
        lookup = self.kwargs.get(self.lookup_field or 'pk')
        if lookup is None:
            raise NotFound('Pedido no encontrado')
        qs = self.get_queryset()
        is_staff = bool(getattr(self.request, 'user', None) and self.request.user.is_staff)
        obj = qs.filter(order_number=str(lookup)).first()
        if obj is None and is_staff and str(lookup).isdigit():
            obj = qs.filter(pk=int(lookup)).first()
        if obj is None:
            raise NotFound('Pedido no encontrado')
        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        """Crear pedido desde carrito."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Retornar pedido creado
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )

    def list(self, request, *args, **kwargs):
        """Listar pedidos (solo admin)."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden listar pedidos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Actualizar pedido (solo admin)."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden actualizar pedidos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Eliminar pedido (solo admin)."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden eliminar pedidos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Obtener pedidos pendientes."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden ver pedidos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_orders = Order.objects.filter(status='pending').order_by('-created_at')
        serializer = self.get_serializer(pending_orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Actualizar estado del pedido (repone stock al cancelar)."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden cambiar estado'},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = self.get_object()
        new_status = request.data.get('status')
        valid = [choice[0] for choice in Order.ORDER_STATUS]
        if new_status not in valid:
            return Response(
                {'error': f'Estado inválido. Opciones: {valid}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=order.pk)
            previous = order.status
            if new_status == 'cancelled' and previous != 'cancelled':
                items = list(order.items.select_related(None).values_list('product_id', 'quantity'))
                if items:
                    pids = [pid for pid, _ in items]
                    list(Product.objects.select_for_update().order_by('id').filter(id__in=pids))
                    for pid, qty in items:
                        Product.objects.filter(id=pid).update(stock=F('stock') + qty)
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])

        order.refresh_from_db()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        """Obtener resumen del pedido para factura."""
        order = self.get_object()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        """Generar y descargar recibo PDF del pedido (público, por order_number)."""
        try:
            order = self.get_object()
            pdf_generator = PDFReceiptGenerator()
            pdf_buffer = pdf_generator.generate(order)
            filename = f"Recibo_{order.order_number}.pdf"
            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=filename,
                content_type='application/pdf',
            )
        except NotFound:
            raise
        except Exception:
            logger.exception("Error al generar PDF del pedido")
            return Response(
                {'error': 'No se pudo generar el PDF. Intentá nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['post'])
    def send_whatsapp(self, request, pk=None):
        """Generar enlace de WhatsApp con mensaje del pedido (público)."""
        try:
            order = self.get_object()
            whatsapp_data = WhatsAppMessageGenerator.generate_for_order(order)
            return Response(whatsapp_data, status=status.HTTP_200_OK)
        except NotFound:
            raise
        except Exception:
            logger.exception("Error al generar enlace de WhatsApp")
            return Response(
                {'error': 'No se pudo generar el enlace de WhatsApp. Intentá nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['patch', 'post'])
    def mark_paid(self, request, pk=None):
        """Marcar pedido como pagado (solo admin)."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden marcar pedidos como pagados'},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = self.get_object()
        order.paid = True
        order.paid_at = timezone.now()
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)
