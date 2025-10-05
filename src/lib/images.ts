export function toCld(src?: string) {
  if (!src) return src || '';
  const isAbsolute = /^https?:\/\//i.test(src);
  if (isAbsolute) return src;
  const base = process.env.CLOUDINARY_BASE_URL || '';
  // strip common repo upload roots
  const clean = src
    .replace(/^\/?content\/[a-z]{2}\/uploads\//, '')
    .replace(/^\/?static\/images\/uploads\//, '')
    .replace(/^\/?images\/uploads\//, '');
  return base ? `${base}/${clean}` : src;
}
