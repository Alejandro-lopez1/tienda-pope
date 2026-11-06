from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q, Max
from django.utils import timezone

from apps.orders.models import Order
from .serializers import CustomerSerializer, CustomerDetailSerializer


class CustomerViewSet(viewsets.ViewSet):
    """
    ViewSet para clientes extraídos de órdenes.
    
    Endpoints:
    - GET /api/v1/customers/ - Listar clientes únicos con estadísticas
    - GET /api/v1/customers/{id}/ - Detalle de cliente
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Obtener clientes únicos agregados desde órdenes."""
        # Parámetros de búsqueda y filtrado
        search_query = request.query_params.get('search', '')
        ordering = request.query_params.get('ordering', '-total_spent')
        page = int(request.query_params.get('page', 1))
        page_size = 10

        # Construir queryset base
        customers = Order.objects.values(
            'customer_email',
            'customer_name',
            'customer_phone',
            'customer_address'
        ).annotate(
            total_orders=Count('id'),
            total_spent=Sum('total'),
            avg_order_value=Avg('total'),
            paid_orders=Count('id', filter=Q(paid=True)),
            pending_orders=Count('id', filter=Q(status='pending')),
            last_order_date=Max('created_at')
        ).filter(
            customer_email__isnull=False
        )

        # Búsqueda
        if search_query:
            customers = customers.filter(
                Q(customer_name__icontains=search_query) |
                Q(customer_phone__icontains=search_query) |
                Q(customer_email__icontains=search_query)
            )

        # Ordenamiento
        if ordering == '-total_spent':
            customers = customers.order_by('-total_spent')
        elif ordering == 'total_spent':
            customers = customers.order_by('total_spent')
        elif ordering == '-total_orders':
            customers = customers.order_by('-total_orders')
        elif ordering == 'total_orders':
            customers = customers.order_by('total_orders')
        elif ordering == 'customer_name':
            customers = customers.order_by('customer_name')

        # Paginación
        total_count = customers.count()
        start = (page - 1) * page_size
        end = start + page_size
        customers_page = customers[start:end]

        # Serializar
        serializer = CustomerSerializer(customers_page, many=True)
        
        return Response({
            'count': total_count,
            'next': f'/api/v1/customers/?page={page + 1}' if end < total_count else None,
            'previous': f'/api/v1/customers/?page={page - 1}' if page > 1 else None,
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Obtener resumen de clientes.
        
        Endpoint: GET /api/v1/customers/summary/
        Retorna: {
            'total_customers': int,
            'total_revenue': Decimal,
            'avg_order_value': Decimal,
            'customers_this_month': int,
            'repeat_customers': int
        }
        """
        customers_qs = Order.objects.values(
            'customer_email'
        ).annotate(
            total_orders=Count('id'),
            total_spent=Sum('total')
        )

        total_customers = customers_qs.count()
        total_revenue = sum(c['total_spent'] or 0 for c in customers_qs)
        avg_order_value = total_revenue / Order.objects.count() if Order.objects.count() > 0 else 0

        # Clientes nuevos este mes
        this_month = timezone.now().replace(day=1)
        customers_this_month = Order.objects.filter(
            created_at__gte=this_month
        ).values('customer_email').distinct().count()

        # Clientes que han comprado más de una vez
        repeat_customers = customers_qs.filter(total_orders__gt=1).count()

        return Response({
            'total_customers': total_customers,
            'total_revenue': float(total_revenue),
            'avg_order_value': float(avg_order_value),
            'customers_this_month': customers_this_month,
            'repeat_customers': repeat_customers
        })

    @action(detail=False, methods=['get'])
    def top_customers(self, request):
        """
        Obtener clientes top por gasto total.
        
        Endpoint: GET /api/v1/customers/top_customers/?limit=10
        Retorna: Lista de clientes ordenada por gasto
        """
        limit = int(request.query_params.get('limit', 10))
        
        top_customers = Order.objects.values(
            'customer_email',
            'customer_name',
            'customer_phone'
        ).annotate(
            total_orders=Count('id'),
            total_spent=Sum('total')
        ).order_by('-total_spent')[:limit]

        return Response(list(top_customers))

    @action(detail=False, methods=['get'])
    def by_phone(self, request):
        """
        Buscar cliente por teléfono.
        
        Endpoint: GET /api/v1/customers/by_phone/?phone=+5491234567
        Retorna: Detalle de cliente
        """
        phone = request.query_params.get('phone', '')
        
        if not phone:
            return Response(
                {'error': 'Parámetro phone requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer_data = Order.objects.filter(
            customer_phone=phone
        ).values(
            'customer_email',
            'customer_name',
            'customer_phone',
            'customer_address'
        ).annotate(
            total_orders=Count('id'),
            total_spent=Sum('total'),
            paid_orders=Count('id', filter=Q(paid=True))
        ).first()

        if not customer_data:
            return Response(
                {'error': 'Cliente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(customer_data)

    @action(detail=False, methods=['get'])
    def orders_by_email(self, request):
        """
        Obtener todas las órdenes de un cliente por email.
        
        Endpoint: GET /api/v1/customers/orders_by_email/?email=customer@example.com
        Retorna: Lista de órdenes del cliente
        """
        email = request.query_params.get('email', '')
        
        if not email:
            return Response(
                {'error': 'Parámetro email requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        orders = Order.objects.filter(
            customer_email=email
        ).order_by('-created_at')

        from apps.orders.serializers import OrderSerializer
        serializer = OrderSerializer(orders, many=True)
        
        return Response(serializer.data)
