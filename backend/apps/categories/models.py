from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """
    Modelo para categorías de productos.
    Ejemplo: Desinfectantes, Limpiadores, Escobas, etc.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nombre de la categoría (ej: Desinfectantes)"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        blank=True,
        help_text="URL amigable (generado automáticamente)"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción de la categoría"
    )
    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        help_text="Imagen representativa de la categoría"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="¿Está visible en el catálogo?"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Orden de visualización en el catálogo"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
