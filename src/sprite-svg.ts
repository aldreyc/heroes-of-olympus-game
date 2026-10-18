let nextCropId = 0;

/** Clip the sheet itself; viewBox/meet alone can expose neighbors in letterbox space. */
export function spriteSvg(file: string, size: number[], rect: number[], className = "") {
  const [x, y, width, height] = rect;
  const id = `sprite-crop-${++nextCropId}`;
  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMax meet" style="aspect-ratio:${width}/${height}" role="presentation"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#${id})"><image href="/assets/art/${file}" x="${-x}" y="${-y}" width="${size[0]}" height="${size[1]}"/></g></svg>`;
}
