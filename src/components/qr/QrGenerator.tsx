"use client";

/**
 * Portable QR generator with logo overlay.
 *
 * Renders 5 styled variants of the same URL as 2048×2048 PNGs and lets the
 * user download each one. The center logo overlay uses error-correction-
 * level-H (~30% damage tolerance) so a ~22% center badge stays well within
 * the safe scan zone.
 *
 * Usage:
 *   <QrGenerator
 *     url="https://your-app.com/signup"
 *     logoSrc="/logo.png"
 *     filenamePrefix="qr-signup"
 *     brandDark="#d92626"
 *     brandLight="#0a0a12"
 *   />
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const SIZE = 2048;

type Variant = {
  key:
    | "black-on-white"
    | "white-on-black"
    | "white-transparent"
    | "black-transparent"
    | "rounded-brand";
  label: string;
  dark: string;
  light: string;
  rounded?: boolean;
};

type Props = {
  /** The URL the QR will encode. */
  readonly url: string;
  /** Optional path to a logo to overlay in the center (e.g. "/logo.png"). Omit to render plain QR codes. */
  readonly logoSrc?: string;
  /** Optional dark-on-transparent logo used when the QR background is light. Defaults to logoSrc. */
  readonly logoSrcDark?: string;
  /** Optional light-on-transparent logo used when the QR background is dark. Defaults to logoSrc. */
  readonly logoSrcLight?: string;
  /** Used as the prefix for the downloaded PNG filename. */
  readonly filenamePrefix?: string;
  /** Brand foreground color for the "Rounded — Brand" variant. */
  readonly brandDark?: string;
  /** Brand background color for the "Rounded — Brand" variant. */
  readonly brandLight?: string;
};

/** Heuristic: pick the right logo asset for a given QR background colour. */
function pickLogoForVariant(
  variant: Variant,
  logoSrc?: string,
  logoSrcDark?: string,
  logoSrcLight?: string
): string | undefined {
  // If a single fallback was passed and no per-tone variants, use it.
  if (!logoSrcDark && !logoSrcLight) return logoSrc;
  // For transparent backgrounds we look at the dark (foreground) colour to
  // decide which logo will be visible. White ink on a transparent canvas → use
  // the white logo so it matches the QR ink.
  const isLightForeground = variant.dark === "#ffffff";
  const isDarkBackground =
    variant.light === "#000000" ||
    (variant.light.startsWith("#") && variant.light.length === 9 && variant.light.endsWith("00") && isLightForeground);
  // Rule of thumb: dark ink → black logo, light ink → white logo.
  return isLightForeground || isDarkBackground ? (logoSrcLight ?? logoSrc) : (logoSrcDark ?? logoSrc);
}

export default function QrGenerator({
  url,
  logoSrc,
  logoSrcDark,
  logoSrcLight,
  filenamePrefix = "qr",
  brandDark = "#d92626",
  brandLight = "#0a0a12",
}: Props) {
  const variants: readonly Variant[] = [
    { key: "black-on-white", label: "Black on White", dark: "#000000", light: "#ffffff" },
    { key: "white-on-black", label: "White on Black", dark: "#ffffff", light: "#000000" },
    { key: "white-transparent", label: "White on Transparent", dark: "#ffffff", light: "#00000000" },
    { key: "black-transparent", label: "Black on Transparent", dark: "#000000", light: "#00000000" },
    { key: "rounded-brand", label: "Rounded — Brand", dark: brandDark, light: brandLight, rounded: true },
  ];

  return (
    <div>
      <p className="mb-4 text-xs text-gray-500 font-mono break-all">{url}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {variants.map((v) => (
          <QrCard
            key={v.key}
            variant={v}
            url={url}
            logoSrc={pickLogoForVariant(v, logoSrc, logoSrcDark, logoSrcLight)}
            filenamePrefix={filenamePrefix}
          />
        ))}
      </div>
    </div>
  );
}

function QrCard({
  variant,
  url,
  logoSrc,
  filenamePrefix,
}: {
  variant: Variant;
  url: string;
  logoSrc?: string;
  filenamePrefix: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: SIZE,
        margin: 4,
        errorCorrectionLevel: "H",
        color: { dark: variant.dark, light: variant.light },
      },
      (err) => {
        if (err) return;
        if (!canvasRef.current) return;

        const finalize = () => {
          if (!canvasRef.current) return;
          if (variant.rounded) applyRoundedCorners(canvasRef.current, 120);
          setPreviewUrl(canvasRef.current.toDataURL("image/png"));
        };

        if (logoSrc) {
          drawCenterLogo(canvasRef.current, variant, logoSrc).catch(() => {}).finally(finalize);
        } else {
          finalize();
        }
      },
    );
  }, [url, variant.dark, variant.light, variant.rounded, variant.key, logoSrc]);

  function handleDownload() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${filenamePrefix}-${variant.key}.png`;
    a.click();
  }

  return (
    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-lg p-2.5">
      <div
        className="aspect-square rounded overflow-hidden mb-2 flex items-center justify-center"
        style={{
          background: variant.key.includes("transparent")
            ? "repeating-conic-gradient(#1a1a2e 0% 25%, #0a0a12 0% 50%) 50% / 12px 12px"
            : "transparent",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={variant.label} className="w-full h-full" />
        ) : (
          <div className="text-gray-400 text-[10px]">…</div>
        )}
      </div>
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="hidden" />
      <p className="text-[10px] font-semibold text-gray-900 dark:text-white mb-1.5 truncate" title={variant.label}>
        {variant.label}
      </p>
      <button
        onClick={handleDownload}
        disabled={!previewUrl}
        className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/15 rounded-md text-[10px] font-semibold tracking-wide uppercase disabled:opacity-50"
        title="Download 2048×2048 PNG"
      >
        ↓ PNG
      </button>
    </div>
  );
}

/**
 * Paint a logo into the center of an already-rendered QR canvas.
 * ECC-H gives ~30% recovery — the ~22% center badge stays inside the safe zone.
 */
async function drawCenterLogo(
  canvas: HTMLCanvasElement,
  variant: Variant,
  logoSrc: string,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = await loadLogo(logoSrc);
  const w = canvas.width;
  const h = canvas.height;

  const badgeSize = Math.round(w * 0.22);
  const badgeX = (w - badgeSize) / 2;
  const badgeY = (h - badgeSize) / 2;
  const badgeRadius = Math.round(badgeSize * 0.18);

  // For transparent variants we fall back to a solid pill so the logo is
  // still legible against any background.
  const isTransparent = variant.key.includes("transparent");
  const badgeFill = isTransparent
    ? variant.dark === "#ffffff"
      ? "#0a0a12"
      : "#ffffff"
    : variant.light;

  ctx.save();
  ctx.fillStyle = badgeFill;
  roundedRectPath(ctx, badgeX, badgeY, badgeSize, badgeSize, badgeRadius);
  ctx.fill();
  ctx.restore();

  const logoInset = Math.round(badgeSize * 0.12);
  const logoSize = badgeSize - logoInset * 2;
  ctx.drawImage(img, badgeX + logoInset, badgeY + logoInset, logoSize, logoSize);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Cache decoded logos so we don't refetch for every variant. Keyed by src so
// multiple QrGenerator instances with different logos still benefit.
const logoCache = new Map<string, Promise<HTMLImageElement>>();
function loadLogo(src: string): Promise<HTMLImageElement> {
  const cached = logoCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  logoCache.set(src, promise);
  return promise;
}

function applyRoundedCorners(canvas: HTMLCanvasElement, radius: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  const r = radius;
  const w = canvas.width;
  const h = canvas.height;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}
