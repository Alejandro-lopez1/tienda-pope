"""
Servicios para la aplicación de pedidos.
Incluye generación de PDFs, integración con WhatsApp, etc.
"""

from io import BytesIO
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from django.utils.html import escape
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status

from .models import Order
from apps.settings.models import StoreSettings


class PDFReceiptGenerator:
    """Generador de recibos PDF usando reportlab."""
    
    # Colores de Popé (extraídos del logo)
    COLOR_PRIMARY = colors.HexColor('#FF4757')  # Rojo/Rosa
    COLOR_SECONDARY = colors.HexColor('#7DC41F')  # Verde
    COLOR_DARK = colors.HexColor('#2C3E50')  # Gris oscuro
    COLOR_LIGHT = colors.HexColor('#ECF0F1')  # Gris claro
    
    # Márgenes
    TOP_MARGIN = 0.5 * inch
    BOTTOM_MARGIN = 0.5 * inch
    LEFT_MARGIN = 0.75 * inch
    RIGHT_MARGIN = 0.75 * inch
    
    def generate(self, order: Order) -> BytesIO:
        """
        Genera un PDF de recibo para un pedido.
        
        Args:
            order: Instancia de Order
            
        Returns:
            BytesIO: Archivo PDF en bytes
        """
        buffer = BytesIO()
        
        # Crear documento PDF
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=self.TOP_MARGIN,
            bottomMargin=self.BOTTOM_MARGIN,
            leftMargin=self.LEFT_MARGIN,
            rightMargin=self.RIGHT_MARGIN,
            title=f"Recibo {order.order_number}",
        )
        
        # Construir elementos del documento
        elements = self._build_elements(order)
        
        # Generar PDF
        doc.build(elements)
        buffer.seek(0)
        
        return buffer
    
    def _build_elements(self, order: Order) -> list:
        """Construye los elementos del PDF."""
        elements = []
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=self.COLOR_PRIMARY,
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=self.COLOR_DARK,
            spaceAfter=6,
            spaceBefore=12,
            fontName='Helvetica-Bold',
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=self.COLOR_DARK,
            spaceAfter=4,
        )
        
        # 1. Encabezado - Nombre de la tienda
        store_settings = StoreSettings.get_or_create_default()
        elements.append(Paragraph(store_settings.store_name, title_style))
        elements.append(Paragraph("Productos de Limpieza", normal_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # 2. Número de recibo
        elements.append(Paragraph(f"Recibo #{order.order_number}", heading_style))
        elements.append(Spacer(1, 0.1 * inch))
        
        # 3. Información del pedido
        order_info = [
            f"<b>Fecha:</b> {order.created_at.strftime('%d/%m/%Y %H:%M')}",
            f"<b>Estado:</b> {order.get_status_display()}",
            f"<b>Método de pago:</b> {order.get_payment_method_display()}",
        ]
        if order.paid:
            order_info.append(f"<b>Pagado:</b> Sí")
        else:
            order_info.append(f"<b>Pagado:</b> No")
        
        for info in order_info:
            elements.append(Paragraph(info, normal_style))
        
        elements.append(Spacer(1, 0.15 * inch))
        
        # 4. Información del cliente
        elements.append(Paragraph("INFORMACIÓN DEL CLIENTE", heading_style))
        customer_info = [
            f"<b>Nombre:</b> {escape(order.customer_name)}",
            f"<b>Teléfono:</b> {escape(order.customer_phone)}",
        ]
        if order.customer_email:
            customer_info.append(f"<b>Email:</b> {escape(order.customer_email)}")
        if order.customer_address:
            customer_info.append(f"<b>Dirección:</b> {escape(order.customer_address)}")
        
        for info in customer_info:
            elements.append(Paragraph(info, normal_style))
        
        elements.append(Spacer(1, 0.15 * inch))
        
        # 5. Tabla de ítems
        elements.append(Paragraph("DETALLES DEL PEDIDO", heading_style))
        
        items_data = [
            ['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']
        ]
        
        for item in order.items.all():
            product_name = item.product.name[:30] if item.product else "[Producto eliminado]"
            items_data.append([
                product_name,
                str(item.quantity),
                f"${item.price:.2f}",
                f"${item.subtotal:.2f}",
            ])
        
        # Tabla con estilo
        items_table = Table(items_data, colWidths=[3.5*inch, 1*inch, 1.2*inch, 1.2*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.COLOR_SECONDARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),  # Producto alineado a izquierda
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), self.COLOR_LIGHT),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, self.COLOR_LIGHT]),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ]))
        
        elements.append(items_table)
        elements.append(Spacer(1, 0.15 * inch))
        
        # 6. Resumen de totales
        summary_data = [
            ['Subtotal:', f"${order.subtotal:.2f}"],
        ]
        
        if order.discount_amount > 0:
            summary_data.append(['Descuento:', f"-${order.discount_amount:.2f}"])
        
        summary_data.append(['TOTAL:', f"${order.total:.2f}"])
        
        summary_table = Table(summary_data, colWidths=[4*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -2), 10),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('BACKGROUND', (0, -1), (-1, -1), self.COLOR_PRIMARY),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ('TOPPADDING', (0, -1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
            ('LINEBELOW', (0, -2), (-1, -2), 2, self.COLOR_SECONDARY),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 0.2 * inch))
        
        # 7. Notas o pie de página
        footer_text = "Gracias por tu compra"
        if store_settings.whatsapp_number:
            footer_text += " en {store_name}. Para consultas, contacta por WhatsApp.".format(
                store_name=store_settings.store_name
            )
        else:
            footer_text += f" en {store_settings.store_name}."
        
        elements.append(Paragraph(
            f"<i>{footer_text}</i>",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, textColor=colors.grey)
        ))
        
        return elements


class WhatsAppMessageGenerator:
    """Generador de mensajes y enlaces de WhatsApp para pedidos."""
    
    @staticmethod
    def generate_message(order: Order) -> str:
        """
        Genera un mensaje de WhatsApp con resumen del pedido.
        
        Args:
            order: Instancia de Order
            
        Returns:
            str: Mensaje formateado
        """
        items_summary = "\n".join([
            f"• {item.product.name if item.product else '[Producto eliminado]'} x{item.quantity} - ${item.subtotal:.2f}"
            for item in order.items.all()
        ])
        
        message = f"""
Hola Popé 👋

Confirmo mi pedido:

*Número de Pedido:* {order.order_number}
*Cliente:* {order.customer_name}
*Teléfono:* {order.customer_phone}

*Productos:*
{items_summary}

*Subtotal:* ${order.subtotal:.2f}
*Descuento:* ${order.discount_amount:.2f}
*TOTAL:* *${order.total:.2f}*

*Método de pago:* {order.get_payment_method_display()}
*Pagado:* {'Sí' if order.paid else 'No'}

Gracias 🙏
        """.strip()
        
        return message
    
    @staticmethod
    def generate_whatsapp_link(message: str, phone_number: str = None) -> str:
        """
        Genera un enlace wa.me con el mensaje codificado.
        
        Args:
            message: Texto del mensaje
            phone_number: Número de WhatsApp (formato: 541647710683). Si es None, obtiene de StoreSettings.
            
        Returns:
            str: URL de WhatsApp, o None si no hay número configurado
        """
        if phone_number is None:
            store_settings = StoreSettings.get_or_create_default()
            phone_number = store_settings.whatsapp_number
        
        if not phone_number:
            return None  # Retornar None si no hay número configurado
        
        from urllib.parse import quote
        
        # Codificar el mensaje para URL
        encoded_message = quote(message)
        
        # Generar enlace wa.me
        link = f"https://wa.me/{phone_number}?text={encoded_message}"
        
        return link
    
    @classmethod
    def generate_for_order(cls, order: Order) -> dict:
        """
        Genera mensaje y enlace de WhatsApp completos para un pedido.
        
        Args:
            order: Instancia de Order
            
        Returns:
            dict: {
                'message': str (mensaje),
                'whatsapp_link': str (enlace wa.me) o None,
                'phone_number': str (número de Popé) o None
            }
        """
        store_settings = StoreSettings.get_or_create_default()
        message = cls.generate_message(order)
        link = cls.generate_whatsapp_link(message, store_settings.whatsapp_number)
        
        return {
            'message': message,
            'whatsapp_link': link,
            'phone_number': store_settings.whatsapp_number or None,
        }
