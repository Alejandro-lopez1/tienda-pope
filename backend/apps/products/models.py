import logging
import os
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify
from PIL import Image, ImageOps

from apps.categories.models import Category

logger = logging.getLogger(__name__)


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
        # Generar slug automáticamente (con sufijo si colisiona)
        if not self.slug:
            base_slug = slugify(self.name) or 'producto'
            slug = base_slug
            counter = 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        # Recomprimir SOLO si se asignó una imagen nueva (no descargar la guardada)
        if self.image and not self.image._committed:
            try:
                self._compress_image()
            except Exception:
                logger.exception('Error al procesar imagen de producto %s', self.sku)

        super().save(*args, **kwargs)

    def _compress_image(self):
        """Procesa una imagen nueva: corrige EXIF, normaliza RGB, redimensiona y genera thumbnail."""
        self.image.seek(0)
        img = Image.open(self.image)
        img = ImageOps.exif_transpose(img)
        img = img.convert('RGB')

        basename = os.path.splitext(os.path.basename(self.image.name or 'image'))[0] or 'image'

        # Imagen principal: máx 1200x1200, reemplaza el archivo subido
        main = img.copy()
        main.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        main_io = BytesIO()
        main.save(main_io, format='JPEG', quality=85, optimize=True)
        main_io.seek(0)
        self.image.save(f"{basename}.jpg", ContentFile(main_io.read()), save=False)

        # Thumbnail: máx 400x400 en products/thumbnails/<basename>.jpg (sin rutas anidadas)
        thumb = img.copy()
        thumb.thumbnail((400, 400), Image.Resampling.LANCZOS)
        thumb_io = BytesIO()
        thumb.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_io.seek(0)
        self.image_thumbnail.save(f"{basename}.jpg", ContentFile(thumb_io.read()), save=False)

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
