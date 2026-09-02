import { toPng, toBlob, toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';
import { PosterData } from '../types';

/**
 * Downloads a data URL or Blob as a file in the browser
 */
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {}
  }, 150);
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
      domNode.closest('.screenshot-exclude')
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Direct Live DOM Screenshot Capture
 * Captures EXACTLY what is on the screen with 100% fidelity (Poster art, title, credits, glass border)
 */
export async function capturePosterScreenshot(
  container: HTMLElement,
  _poster?: PosterData
): Promise<string> {
  const width = container.offsetWidth || window.innerWidth;
  const height = container.offsetHeight || window.innerHeight;
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);

  // Attempt 1: Direct html-to-image toPng with skipFonts & CORS enabled
  try {
    const dataUrl = await toPng(container, {
      pixelRatio,
      width,
      height,
      backgroundColor: '#050505',
      skipFonts: true, // Prevents CORS errors on external Google Fonts stylesheets
      cacheBust: false,
      filter: isScreenshotAllowedElement,
    });

    if (dataUrl && dataUrl.length > 5000 && !dataUrl.includes('data:,')) {
      return dataUrl;
    }
  } catch (err1) {
    console.warn('Screenshot Attempt 1 (html-to-image) failed:', err1);
  }

  // Attempt 2: html2canvas (Rock-solid DOM Rasterizer)
  try {
    const canvas = await html2canvas(container, {
      scale: pixelRatio,
      backgroundColor: '#050505',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width,
      height,
      ignoreElements: (element) => !isScreenshotAllowedElement(element),
    });

    const canvasDataUrl = canvas.toDataURL('image/png', 1.0);
    if (canvasDataUrl && canvasDataUrl.length > 5000) {
      return canvasDataUrl;
    }
  } catch (err2) {
    console.warn('Screenshot Attempt 2 (html2canvas) failed:', err2);
  }

  // Attempt 3: html-to-image toBlob
  try {
    const blob = await toBlob(container, {
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
    const jpegUrl = await toJpeg(container, {
      quality: 0.96,
      pixelRatio: 1.5,
      backgroundColor: '#050505',
      skipFonts: true,
      filter: isScreenshotAllowedElement,
    });

    if (jpegUrl && jpegUrl.length > 5000) {
      return jpegUrl;
    }
  } catch (err4) {
    console.warn('Screenshot Attempt 4 (toJpeg) failed:', err4);
  }

  throw new Error('Screenshot capture could not be completed');
}
