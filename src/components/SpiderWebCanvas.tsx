import React, { useEffect, useRef } from 'react';
import { WebShot } from '../types';

interface SpiderWebCanvasProps {
  webs: WebShot[];
  accentColor: string;
  onClearWebs?: () => void;
}

export const SpiderWebCanvas: React.FC<SpiderWebCanvasProps> = ({
  webs,
  accentColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const now = Date.now();

      webs.forEach((web) => {
        const elapsed = now - web.createdAt;
        const duration = 2500; // web stays for 2.5s and fades
        if (elapsed > duration) return;

        const progress = Math.min(1, elapsed / 180); // fast shot progress
        const alpha = Math.max(0, 1 - (elapsed - 1200) / (duration - 1200));

        const currentEndX = web.startX + (web.endX - web.startX) * progress;
        const currentEndY = web.startY + (web.endY - web.startY) * progress;

        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha);

        // Main primary web filament
        ctx.beginPath();
        ctx.moveTo(web.startX, web.startY);

        // Slight natural curve / sag
        const midX = (web.startX + currentEndX) / 2;
        const midY = (web.startY + currentEndY) / 2 + Math.sin(elapsed * 0.03) * 4;
        ctx.quadraticCurveTo(midX, midY, currentEndX, currentEndY);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = accentColor || '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Secondary spiral strands
        const strandCount = 4;
        for (let i = 0; i < strandCount; i++) {
          const t = i / strandCount;
          const px = web.startX + (currentEndX - web.startX) * t;
          const py = web.startY + (currentEndY - web.startY) * t;

          // Cross threads
          ctx.beginPath();
          const angle = Math.atan2(currentEndY - web.startY, currentEndX - web.startX) + Math.PI / 2;
          const dist = 6 + Math.sin(t * 12 + elapsed * 0.02) * 5;
          ctx.moveTo(px + Math.cos(angle) * dist, py + Math.sin(angle) * dist);
          ctx.lineTo(px - Math.cos(angle) * dist, py - Math.sin(angle) * dist);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Web impact / anchor splat at target
        if (progress >= 0.95) {
          const impactRadius = Math.min(22, (elapsed - 150) * 0.15);
          if (impactRadius > 0) {
            // Web center node
            ctx.beginPath();
            ctx.arc(web.endX, web.endY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 16;
            ctx.fill();

            // Web radial anchor spokes
            for (let a = 0; a < 8; a++) {
              const rad = (a * Math.PI) / 4 + Math.sin(a * 3);
              ctx.beginPath();
              ctx.moveTo(web.endX, web.endY);
              const spokeLen = impactRadius * (0.7 + (a % 3) * 0.2);
              ctx.lineTo(web.endX + Math.cos(rad) * spokeLen, web.endY + Math.sin(rad) * spokeLen);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }

            // Web spiral rings
            for (let r = 6; r <= impactRadius; r += 7) {
              ctx.beginPath();
              for (let a = 0; a <= 8; a++) {
                const rad = (a * Math.PI) / 4 + Math.sin(a * 3);
                const px = web.endX + Math.cos(rad) * r;
                const py = web.endY + Math.sin(rad) * r;
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [webs, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      id="spider-web-canvas"
      className="absolute inset-0 pointer-events-none z-30 w-full h-full screenshot-exclude"
    />
  );
};
