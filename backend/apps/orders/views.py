from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import FileResponse
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderListSerializer, OrderCreateSerializer
from .services import PDFReceiptGenerator, WhatsAppMessageGenerator


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
        """Permisos según la acción."""
        if self.action == 'create':
            # Permitir crear pedidos anónimamente
            return [AllowAny()]
        elif self.action in ['list', 'update', 'partial_update', 'destroy']:
            # Solo admin
            return [IsAuthenticated()]
        return [AllowAny()]

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
        """Actualizar estado del pedido."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden cambiar estado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in [choice[0] for choice in Order.ORDER_STATUS]:
            return Response(
                {'error': f'Estado inválido. Opciones: {[choice[0] for choice in Order.ORDER_STATUS]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        
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
        """
        Generar y descargar recibo PDF del pedido.
        
        Endpoint: GET /api/v1/orders/{id}/generate-pdf/
        Retorna: Archivo PDF para descargar
        Permisos: Público (cualquiera con el ID del pedido)
        """
        try:
            order = self.get_object()
            
            # Generar PDF
            pdf_generator = PDFReceiptGenerator()
            pdf_buffer = pdf_generator.generate(order)
            
            # Retornar como descarga de archivo
            filename = f"Recibo_{order.order_number}.pdf"
            response = FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=filename,
                content_type='application/pdf'
            )
            
            return response
        
        except Order.DoesNotExist:
            return Response(
                {'error': 'Pedido no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al generar PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_whatsapp(self, request, pk=None):
        """
        Generar enlace de WhatsApp con mensaje del pedido.
        
        Endpoint: POST /api/v1/orders/{id}/send-whatsapp/
        Retorna: {
            'message': str,
            'whatsapp_link': str,
            'phone_number': str
        }
        Permisos: Público
        """
        try:
            order = self.get_object()
            
            # Generar mensaje y enlace de WhatsApp
            whatsapp_data = WhatsAppMessageGenerator.generate_for_order(order)
            
            return Response(whatsapp_data, status=status.HTTP_200_OK)
        
        except Order.DoesNotExist:
            return Response(
                {'error': 'Pedido no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error al generar enlace de WhatsApp: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
