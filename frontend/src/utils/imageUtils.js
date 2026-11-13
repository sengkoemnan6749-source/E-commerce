const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

export function hasCustomAvatar(user) {
  return Boolean(user?.avatar && user.avatar !== '/images/avatars/sara.png');
}

/**
 * Center-crops and resizes a user-selected image file to a compact square Data URL.
 */
export function resizeAvatarImage(file, outputSize = 256) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(String(file.type || '').toLowerCase())) {
      reject(new Error('Please choose a JPG, PNG, WebP, or GIF image.'));
      return;
    }
    if (file.size > MAX_RAW_FILE_BYTES) {
      reject(new Error('Image file must be 8 MB or smaller.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const minSide = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - minSide) / 2);
        const sy = Math.floor((img.height - minSide) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Unable to process image in this browser.');
        }

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, outputSize, outputSize);
        let dataUrl = canvas.toDataURL('image/webp', 0.86);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        }
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };

    img.src = objectUrl;
  });
}

