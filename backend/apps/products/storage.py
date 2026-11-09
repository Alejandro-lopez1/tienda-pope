import logging

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

logger = logging.getLogger(__name__)


@deconstructible
class CloudinaryMediaStorage(Storage):
    """Minimal Django storage backed by Cloudinary (uses CLOUDINARY_URL env)."""

    def _open(self, name, mode='rb'):
        raise NotImplementedError('CloudinaryMediaStorage does not support opening remote files.')

    def _save(self, name, content):
        content.seek(0)
        options = {
            'folder': 'tienda-pope/media',
            'use_filename': True,
            'unique_filename': True,
            'overwrite': False,
            'resource_type': 'image',
        }
        try:
            result = cloudinary.uploader.upload(content, **options)
        except Exception:
            logger.exception('Cloudinary upload failed for %s', name)
            raise
        public_id = result.get('public_id')
        fmt = result.get('format')
        if public_id and fmt and not public_id.endswith(f'.{fmt}'):
            return f"{public_id}.{fmt}"
        return public_id or name

    def url(self, name):
        if not name:
            return ''
        name = str(name)
        if name.startswith('http://') or name.startswith('https://'):
            return name
        base, _dot, _fmt = name.rpartition('.')
        public_id = base if base else name
        url, _opts = cloudinary.utils.cloudinary_url(public_id, secure=True)
        return url

    def delete(self, name):
        if not name:
            return
        name = str(name)
        if name.startswith('http://') or name.startswith('https://'):
            return
        base, _dot, _fmt = name.rpartition('.')
        public_id = base if base else name
        try:
            cloudinary.uploader.destroy(public_id, resource_type='image')
        except Exception:
            logger.exception('Cloudinary delete failed for %s', name)

    def exists(self, name):
        # Cloudinary uses unique filenames; skip existence checks to avoid extra API calls.
        return False

    def size(self, name):
        return 0
