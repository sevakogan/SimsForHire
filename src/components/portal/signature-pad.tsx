"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SignaturePadProps {
  /** Callback with data URL (PNG) when signature changes */
  onChange: (dataUrl: string | null) => void;
  /** Pre-existing signature data URL (for read-only display) */
  value?: string | null;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Disable drawing (read-only mode) */
  disabled?: boolean;
  /** Label above the pad */
  label?: string;
  /** Placeholder text when empty */
  placeholder?: string;
}

type InputMode = "draw" | "type";

export function SignaturePad({
  onChange,
  value = null,
  width = 400,
  height = 150,
  disabled = false,
  label = "Signature",
  placeholder = "Sign here",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [mode, setMode] = useState<InputMode>("draw");
  const [typedText, setTypedText] = useState("");
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // If we have a pre-existing value, show it read-only
  const showPreview = disabled && value;

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || mode !== "draw") return;
      e.preventDefault();
      const point = getCanvasPoint(e);
      lastPointRef.current = point;
      setIsDrawing(true);

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [disabled, mode, getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled || mode !== "draw") return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const point = getCanvasPoint(e);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPointRef.current = point;
    },
    [isDrawing, disabled, mode, getCanvasPoint]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas has actual content
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasPixels = imageData.data.some((_, i) =>
      i % 4 === 3 ? imageData.data[i] > 0 : false
    );

    setHasContent(hasPixels);
    onChange(hasPixels ? canvas.toDataURL("image/png") : null);
  }, [isDrawing, onChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange(null);
  }, [onChange]);

  // Render typed text onto canvas
  useEffect(() => {
    if (mode !== "type") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typedText.trim()) {
      // Use a cursive font for signature feel
      const fontSize = Math.min(48, canvas.width / (typedText.length * 0.55));
      ctx.font = `italic ${fontSize}px "Georgia", "Times New Roman", serif`;
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);

      setHasContent(true);
      onChange(canvas.toDataURL("image/png"));
    } else {
      setHasContent(false);
      onChange(null);
    }
  }, [typedText, mode, onChange]);

  // Clear canvas when switching modes
  useEffect(() => {
    clearCanvas();
    setTypedText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (showPreview) {
    return (
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value!}
            alt="Signature"
            className="max-h-20 object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {!disabled && (
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setMode("draw")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                mode === "draw"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                mode === "type"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Type
            </button>
          </div>
        )}
      </div>

      <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden transition-colors focus-within:border-primary/50">
        {mode === "draw" ? (
          <canvas
            ref={canvasRef}
            width={width * 2}
            height={height * 2}
            style={{ width, height, maxWidth: "100%", touchAction: "none" }}
            className="cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={width * 2}
              height={height * 2}
              style={{
                width,
                height,
                maxWidth: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full border-none bg-transparent px-4 py-6 text-center text-2xl italic text-gray-900 placeholder:text-gray-300 focus:outline-none"
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                minHeight: height,
              }}
            />
          </>
        )}

        {/* Placeholder for draw mode */}
        {mode === "draw" && !hasContent && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-gray-300">{placeholder}</span>
          </div>
        )}

        {/* Signature line */}
        <div className="absolute bottom-4 left-6 right-6 border-b border-gray-200" />
      </div>

      {/* Clear button */}
      {!disabled && hasContent && (
        <button
          type="button"
          onClick={() => {
            clearCanvas();
            setTypedText("");
          }}
          className="mt-1.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}
