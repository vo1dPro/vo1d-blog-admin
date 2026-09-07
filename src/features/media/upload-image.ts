import { request } from '../../api/client';
import type { UploadResult } from '../../api/types';

// SVG is loaded as an image, never injected into the document. The API receives
// PNG pixels and applies its normal signature checks and lossless icon encoding.
async function rasterizeIcon(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('图标加载超时。')), 10000);
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('SVG 无法读取，请导出为 PNG 后重试。'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('图标尺寸无效。');
    const scale = 512 / Math.max(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法转换图标。');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('SVG 转换失败，请使用 PNG。'))),
        'image/png',
      ),
    );
    return new File([blob], file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' });
  } finally {
    clearTimeout(timer);
    image.onload = null;
    image.onerror = null;
    image.src = '';
    URL.revokeObjectURL(url);
  }
}
export function validateImage(file: File, allowSvg = false): string | null {
  if (
    !(
      allowSvg
        ? ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        : ['image/jpeg', 'image/png', 'image/webp']
    ).includes(file.type) ||
    !(allowSvg ? /\.(jpe?g|png|webp|svg)$/i : /\.(jpe?g|png|webp)$/i).test(file.name)
  )
    return allowSvg ? '仅支持 JPEG、PNG、WebP、SVG 图标。' : '仅支持 JPEG、PNG、WebP 图片。';
  if (file.size > 10 * 1024 * 1024) return '图片不能超过 10 MiB。';
  if (file.size === 0) return '图片文件为空。';
  return null;
}
export async function uploadImage(
  file: File,
  purpose: 'IMAGE' | 'PHOTO' | 'ICON',
  altText: string,
) {
  const error = validateImage(file, purpose === 'ICON');
  if (error) throw new Error(error);
  const body = new FormData();
  body.set('file', file.type === 'image/svg+xml' ? await rasterizeIcon(file) : file);
  body.set('purpose', purpose);
  if (altText.trim()) body.set('altText', altText.trim());
  return request<UploadResult>('/admin/media/images', { method: 'POST', body });
}
