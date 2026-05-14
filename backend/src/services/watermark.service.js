const WATERMARK_TEXT = 'GestDoc-TG';
const FONT = 'Arial_24_bold';
const COLOR = '999999';
const OPACITY = 45;
const PADDING = 15;

function overlayTransform() {
  const overlay = `l_text:${FONT}:${WATERMARK_TEXT},co_rgb:${COLOR},o_${OPACITY},y_${PADDING},x_${PADDING}`;
  const corners = ['g_south_east', 'g_south_west', 'g_north_east', 'g_north_west']
    .map(g => `${overlay},${g}`)
    .join('/');
  return corners;
}

// Watermark standard pour l'affichage
function getWatermarkedUrl(originalUrl, resourceType) {
  if (!originalUrl || resourceType !== 'image') return originalUrl;
  return originalUrl.replace('/image/upload/', `/image/upload/${overlayTransform()}/`);
}

// URL de téléchargement avec fl_attachment + watermark
function getDownloadUrl(originalUrl, resourceType) {
  if (!originalUrl) return originalUrl;
  if (resourceType !== 'image') {
    return originalUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
  }
  const transforms = `fl_attachment/${overlayTransform()}`;
  return originalUrl.replace('/image/upload/', `/image/upload/${transforms}/`);
}

// URL de base pour le viewer (image par page)
function getViewerBaseUrl(originalUrl, resourceType) {
  if (!originalUrl || resourceType !== 'image') return originalUrl;
  const transforms = `w_800,f_jpg,q_85,${overlayTransform()}`;
  return originalUrl.replace('/image/upload/', `/image/upload/${transforms}/`);
}

module.exports = { getWatermarkedUrl, getDownloadUrl, getViewerBaseUrl };
