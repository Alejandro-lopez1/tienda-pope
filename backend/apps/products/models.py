from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

from apps.categories.models import Category


class Product(models.Model):
    """
    Modelo para productos del catálogo.
    Incluye gestión de imágenes con compresión automática.
    """
    name = models.CharField(
        max_length=200,
        help_text="Nombre del producto"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        blank=True,
        help_text="URL amigable (generado automáticamente)"
    )
    description = models.TextField(
        help_text="Descripción detallada del producto"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        help_text="Categoría del producto"
    )
    sku = models.CharField(
        max_length=100,
        unique=True,
        help_text="Código único del producto (Stock Keeping Unit)"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Precio en ARS"
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de descuento (0-100%)"
    )
    image = models.ImageField(
        upload_to='products/%Y/%m/',
        blank=True,
        null=True,
        help_text="Imagen principal del producto (opcional)"
    )
    image_thumbnail = models.ImageField(
        upload_to='products/thumbnails/',
        blank=True,
        null=True,
        help_text="Thumbnail comprimida (generada automáticamente)"
    )
    stock = models.PositiveIntegerField(
        default=0,
        help_text="Stock disponible"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="¿Está visible en el catálogo?"
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="¿Mostrar en la página principal?"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Calificación promedio (0-5)"
    )
    rating_count = models.PositiveIntegerField(
        default=0,
        help_text="Número de calificaciones"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generar slug automáticamente
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Comprimir imagen si es nueva o fue actualizada
        if self.image and (not self.image_thumbnail or self.image.name):
            self._compress_image()
        
        super().save(*args, **kwargs)

    def _compress_image(self):
        """
        Comprimir imagen a 800x600px máximo.
        Reduce tamaño para mejorar velocidad de carga.
        """
        try:
            if not self.image:
                return

            img = Image.open(self.image)
            
            # Convertir RGBA a RGB si es necesario
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img

            # Redimensionar si es mayor a 800x600
            max_width = 800
            max_height = 600
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

            # Guardar comprimido
            img_io = BytesIO()
            img.save(img_io, format='JPEG', quality=85, optimize=True)
            img_io.seek(0)

            # Generar nombre para thumbnail
            filename = os.path.splitext(self.image.name)[0]
            thumb_filename = f"{filename}_thumb.jpg"

            # Guardar thumbnail
            self.image_thumbnail.save(
                thumb_filename,
                ContentFile(img_io.getvalue()),
                save=False
            )
        except Exception as e:
            # Log error pero no interrumpir guardado
            print(f"Error compressing image: {e}")

    @property
    def discounted_price(self):
        """Calcular precio con descuento."""
        if self.discount_percentage > 0:
            discount_amount = self.price * (self.discount_percentage / 100)
            return self.price - discount_amount
        return self.price

    @property
    def in_stock(self):
        """¿Hay stock disponible?"""
        return self.stock > 0
