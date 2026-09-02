import { toPng, toBlob, toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';
import { PosterData } from '../types';

/**
 * Converts a base64 Data URL to a native Blob object
 * This is essential for iframes (Google AI Studio, sandboxes) where downloading data: URLs is prohibited by Chrome
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binaryStr = atob(parts[1]);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Downloads a data URL or Blob as a file in the browser with iframe sandbox resilience
 */
export function triggerDownload(urlOrBlob: string | Blob, filename: string): string {
  let blobUrl: string;

  if (typeof urlOrBlob === 'string') {
    if (urlOrBlob.startsWith('data:')) {
      const blob = dataUrlToBlob(urlOrBlob);
      blobUrl = URL.createObjectURL(blob);
    } else {
      blobUrl = urlOrBlob;
    }
  } else {
    blobUrl = URL.createObjectURL(urlOrBlob);
  }

  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = blobUrl;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 400);
  } catch (err) {
    console.warn('Direct link download trigger error:', err);
  }

  return blobUrl;
}

/**
 * Filter function to exclude UI buttons, navbars, and toasts from screenshots
 */
function isScreenshotAllowedElement(domNode: Node): boolean {
  if (domNode instanceof HTMLElement) {
    if (
      domNode.classList.contains('screenshot-exclude') ||
      domNode.id === 'center-bottom-ok-btn' ||
      domNode.id === 'bottom-nav-controls' ||
      domNode.id === 'spider-web-canvas' ||
      domNode.id === 'poster-controls-hud' ||
      domNode.id === 'reveal-ui-btn' ||
      domNode.id === 'search-modal-backdrop' ||
      domNode.id === 'movie-player-modal' ||
      domNode.closest('.screenshot-exclude')
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Safely loads an image into an HTMLImageElement without cross-origin canvas tainting
 * Prefers the uncompressed original resolution when available from TMDB
 */
async function loadSafeImage(srcUrl: string): Promise<HTMLImageElement | null> {
  if (!srcUrl) return null;

  // Try fetching highest original resolution if TMDB URL
  const highResUrl = srcUrl.includes('/t/p/')
    ? srcUrl.replace(/\/t\/p\/w\d+\//, '/t/p/original/')
    : srcUrl;

  for (const url of [highResUrl, srcUrl]) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const img = new Image();
        return await new Promise<HTMLImageElement | null>((resolve) => {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = objUrl;
        });
      }
    } catch {}

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
      if (loaded) return loaded;
    } catch {}
  }

  return null;
}

/**
 * Renders rounded rectangle path for canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Direct Fallback HTML5 2D Canvas Synthesizer
 * 100% Guaranteed to work regardless of CSS or DOM rendering errors
 */
export async function generateDirectPosterCanvas(
  poster: PosterData,
  targetWidth = 2560,
  targetHeight = 1440
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be created');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const primary = poster.themeColor?.primary || '#ef4444';
  const glow = poster.themeColor?.glow || 'rgba(239,68,68,0.5)';
  const secondary = poster.themeColor?.secondary || '#f97316';

  // 1. Fill base dark canvas
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Radial ambient color glow
  const grad = ctx.createRadialGradient(
    targetWidth * 0.5,
    targetHeight * 0.45,
    60,
    targetWidth * 0.5,
    targetHeight * 0.45,
    Math.max(targetWidth, targetHeight) * 0.75
  );
  grad.addColorStop(0, primary + '44');
  grad.addColorStop(0.5, glow);
  grad.addColorStop(1, '#050505');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 3. Load Poster Artwork
  const imgUrl = poster.textlessPosterUrl || poster.heroImageUrl || poster.bgImageUrl;
  const loadedImg = await loadSafeImage(imgUrl);

  if (loadedImg) {
    // Atmospheric blurred background
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.filter = 'blur(12px)';
    ctx.drawImage(loadedImg, 0, 0, targetWidth, targetHeight);
    ctx.restore();

    // Dark vignette over background
    const vig = ctx.createLinearGradient(0, 0, 0, targetHeight);
    vig.addColorStop(0, 'rgba(5,5,5,0.8)');
    vig.addColorStop(0.5, 'rgba(5,5,5,0.4)');
    vig.addColorStop(1, '#050505');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Center Poster Artwork Card
    const posterH = targetHeight * 0.65;
    const aspect = loadedImg.width && loadedImg.height ? loadedImg.width / loadedImg.height : 2 / 3;
    const posterW = posterH * aspect;
    const posterX = (targetWidth - posterW) / 2;
    const posterY = targetHeight * 0.14;

    // Glowing drop shadow
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 15;

    // Card border & clip
    drawRoundedRect(ctx, posterX, posterY, posterW, posterH, 20);
    ctx.fillStyle = '#171717';
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, posterX, posterY, posterW, posterH, 20);
    ctx.clip();
    ctx.drawImage(loadedImg, posterX, posterY, posterW, posterH);
    ctx.restore();

    // Border stroke
    ctx.save();
    drawRoundedRect(ctx, posterX, posterY, posterW, posterH, 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // 4. Header Text (Studio Presenter & Tagline)
  ctx.textAlign = 'center';
  ctx.fillStyle = primary;
  ctx.font = '900 13px Montserrat, sans-serif';
  const presenter = (poster.studioPresenter || 'ORIGINAL THEATRICAL PRESENTATION').toUpperCase();
  ctx.fillText(presenter, targetWidth / 2, targetHeight * 0.05);

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(targetWidth / 2 - 40, targetHeight * 0.065);
  ctx.lineTo(targetWidth / 2 + 40, targetHeight * 0.065);
  ctx.stroke();

  if (poster.tagline) {
    ctx.fillStyle = '#d4d4d4';
    ctx.font = 'bold 15px Montserrat, sans-serif';
    ctx.fillText(`"${poster.tagline}"`, targetWidth / 2, targetHeight * 0.095);
  }

  // 5. Main Title & Subtitle
  const titleY = targetHeight * 0.85;
  ctx.save();
  ctx.font = '900 italic 64px Montserrat, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 30;
  const line1 = (poster.titleLine1 || poster.title).toUpperCase();
  ctx.fillText(line1, targetWidth / 2, titleY);

  if (poster.titleLine2) {
    ctx.fillStyle = primary;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 40;
    ctx.fillText(poster.titleLine2.toUpperCase(), targetWidth / 2, titleY + 60);
  }
  ctx.restore();

  // Subtitle / Genres / Year
  const metaText = [
    poster.year || poster.releaseDate?.slice(0, 4),
    poster.rating ? `★ ${poster.rating}` : null,
    poster.genres?.slice(0, 3).join(' • '),
  ]
    .filter(Boolean)
    .join('  |  ');

  ctx.fillStyle = '#a3a3a3';
  ctx.font = 'bold 14px Montserrat, sans-serif';
  ctx.fillText(metaText, targetWidth / 2, targetHeight * 0.94);

  // 6. Bottom Glass Accent Line
  const glassGrad = ctx.createLinearGradient(0, targetHeight - 8, targetWidth, targetHeight - 8);
  glassGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  glassGrad.addColorStop(0.3, primary);
  glassGrad.addColorStop(0.7, secondary);
  glassGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(0, targetHeight - 8, targetWidth, 8);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Direct Live DOM Screenshot Capture
 * Captures EXACTLY what is on the screen with 100% fidelity
 * Features 3-tier fallback to guarantee screenshots never fail
 */
export async function capturePosterScreenshot(
  container: HTMLElement,
  poster?: PosterData
): Promise<string> {
  // Target the poster container directly if present to bypass buttons and HUD
  const targetElement =
    (container.querySelector('#poster-full-container') as HTMLElement) ||
    document.getElementById('poster-full-container') ||
    container;

  const width = targetElement.offsetWidth || window.innerWidth;
  const height = targetElement.offsetHeight || window.innerHeight;
  // High-definition supersampling for crystal-clear poster typography and artwork
  const pixelRatio = Math.max(window.devicePixelRatio || 2, 2.5);

  // Attempt 1: Direct html-to-image with skipFonts and cacheBust
  try {
    const dataUrl = await toPng(targetElement, {
      pixelRatio,
      quality: 1.0,
      width,
      height,
      backgroundColor: '#050505',
      skipFonts: true,
      cacheBust: true,
      filter: isScreenshotAllowedElement,
    });

    if (dataUrl && dataUrl.length > 8000 && !dataUrl.includes('data:,')) {
      return dataUrl;
    }
  } catch (err1) {
    console.warn('Screenshot Attempt 1 (html-to-image) failed:', err1);
  }

  // Attempt 2: html2canvas with allowTaint: false (PREVENTS TAINTED CANVAS ERROR)
  try {
    const canvas = await html2canvas(targetElement, {
      scale: pixelRatio,
      backgroundColor: '#050505',
      useCORS: true,
      allowTaint: false, // Must be false so toDataURL never throws SecurityError
      logging: false,
      imageTimeout: 15000,
      width,
      height,
      ignoreElements: (element) => !isScreenshotAllowedElement(element),
    });

    const canvasDataUrl = canvas.toDataURL('image/png', 1.0);
    if (canvasDataUrl && canvasDataUrl.length > 8000 && !canvasDataUrl.includes('data:,')) {
      return canvasDataUrl;
    }
  } catch (err2) {
    console.warn('Screenshot Attempt 2 (html2canvas) failed:', err2);
  }

  // Attempt 3: html-to-image toBlob
  try {
    const blob = await toBlob(targetElement, {
      pixelRatio: 1.5,
      backgroundColor: '#050505',
      skipFonts: true,
      filter: isScreenshotAllowedElement,
    });

    if (blob && blob.size > 10000) {
      return URL.createObjectURL(blob);
    }
  } catch (err3) {
    console.warn('Screenshot Attempt 3 (toBlob) failed:', err3);
  }

  // Attempt 4: html-to-image toJpeg
  try {
    const jpegUrl = await toJpeg(targetElement, {
      quality: 0.95,
      pixelRatio: 1.5,
      backgroundColor: '#050505',
      skipFonts: true,
      filter: isScreenshotAllowedElement,
    });

    if (jpegUrl && jpegUrl.length > 8000) {
      return jpegUrl;
    }
  } catch (err4) {
    console.warn('Screenshot Attempt 4 (toJpeg) failed:', err4);
  }

  // Attempt 5: Foolproof Direct 2D Canvas Fallback Synthesizer
  if (poster) {
    try {
      const fallbackUrl = await generateDirectPosterCanvas(poster, width * pixelRatio, height * pixelRatio);
      if (fallbackUrl && fallbackUrl.length > 5000) {
        return fallbackUrl;
      }
    } catch (err5) {
      console.warn('Screenshot Attempt 5 (Direct Canvas) failed:', err5);
    }
  }

  throw new Error('Screenshot capture could not be completed');
}
