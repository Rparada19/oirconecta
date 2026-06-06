/**
 * Storage de creatividades (imágenes, GIFs, vídeos).
 * Proveedor: Cloudinary (vía CLOUDINARY_URL env var, auto-config).
 *
 * Si CLOUDINARY_URL no está set, los endpoints de upload responden 503
 * para que el problema sea evidente en vez de fallar silenciosamente.
 */

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Solo consideramos "configurado" si CLOUDINARY_URL existe Y tiene formato válido
// (debe empezar por cloudinary://). De lo contrario, los endpoints de upload
// responden 503 pero el backend NO crashea al arrancar.
const rawUrl = process.env.CLOUDINARY_URL || '';
const isConfigured = rawUrl.startsWith('cloudinary://');

if (process.env.CLOUDINARY_URL && !isConfigured) {
  console.warn('[storage] CLOUDINARY_URL presente pero con formato inválido (debe empezar con "cloudinary://"). Upload deshabilitado.');
}

if (isConfigured) {
  try {
    cloudinary.config({ secure: true });
  } catch (e) {
    console.error('[storage] Error al configurar Cloudinary:', e.message);
  }
}

/**
 * Multer middleware para uploads de creatividades.
 * Carpeta por defecto: marketing/<actionType-or-misc>/<timestamp>-<random>
 * Acepta: jpg, jpeg, png, gif, webp, mp4, mov
 */
function makeUploader({ folder = 'marketing/misc', maxSizeMB = 10 } = {}) {
  if (!isConfigured) return null;

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const ext = (file.mimetype || '').split('/')[1] || 'bin';
      const isVideo = (file.mimetype || '').startsWith('video/');
      return {
        folder: req.body?.folder || folder,
        resource_type: isVideo ? 'video' : 'image',
        format: ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? undefined : ext,
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ok = /^(image\/(jpe?g|png|gif|webp)|video\/(mp4|quicktime))$/.test(file.mimetype || '');
      if (!ok) return cb(new Error('Formato no permitido. Usa JPG, PNG, GIF, WEBP o MP4.'));
      cb(null, true);
    },
  });
}

/** Eliminar un asset por su public_id (devuelto al subir). */
async function destroy(publicId, { resourceType = 'image' } = {}) {
  if (!isConfigured) throw new Error('Cloudinary no configurado');
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { isConfigured, makeUploader, destroy, cloudinary };
