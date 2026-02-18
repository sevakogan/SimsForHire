"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface InitialsInputProps {
  /** Callback with data URL (PNG) when initials change */
  onChange: (dataUrl: string | null) => void;
  /** Pre-existing initials data URL (for read-only display) */
  value?: string | null;
  /** Disable input (read-only mode) */
  disabled?: boolean;
  /** Label shown next to the box */
  label?: string;
}

type InputMode = "draw" | "type";

export function InitialsInput({
  onChange,
  value = null,
  disabled = false,
  label = "Initials",
}: InitialsInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [mode, setMode] = useState<InputMode>("type");
  const [typedText, setTypedText] = useState("");

  const showPreview = disabled && value;

  const CANVAS_SIZE = 80;
  const CANVAS_SCALE = 2;

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
      setIsDrawing(true);
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const point = getCanvasPoint(e);
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
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [isDrawing, disabled, mode, getCanvasPoint]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
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

  // Render typed initials onto canvas
  useEffect(() => {
    if (mode !== "type") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typedText.trim()) {
      const fontSize = Math.min(60, canvas.width / (typedText.length * 0.6));
      ctx.font = `italic bold ${fontSize}px "Georgia", "Times New Roman", serif`;
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        typedText.toUpperCase(),
        canvas.width / 2,
        canvas.height / 2
      );

      setHasContent(true);
      onChange(canvas.toDataURL("image/png"));
    } else {
      setHasContent(false);
      onChange(null);
    }
  }, [typedText, mode, onChange]);

  // Clear on mode switch
  useEffect(() => {
    clearCanvas();
    setTypedText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (showPreview) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value!}
            alt="Initials"
            className="h-8 w-8 object-contain"
          />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="relative">
        {/* Mode toggle (tiny) */}
        {!disabled && (
          <div className="absolute -top-5 left-0 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMode("draw")}
              className={`text-[8px] px-1.5 py-0.5 rounded ${
                mode === "draw"
                  ? "bg-gray-200 text-gray-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`text-[8px] px-1.5 py-0.5 rounded ${
                mode === "type"
                  ? "bg-gray-200 text-gray-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Type
            </button>
          </div>
        )}

        <div
          className="rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden transition-colors focus-within:border-primary/50"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        >
          {mode === "draw" ? (
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE * CANVAS_SCALE}
              height={CANVAS_SIZE * CANVAS_SCALE}
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                touchAction: "none",
              }}
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
            <input
              type="text"
              value={typedText}
              onChange={(e) => {
                // Max 4 chars for initials
                const val = e.target.value.slice(0, 4);
                setTypedText(val);
              }}
              placeholder="AB"
              maxLength={4}
              disabled={disabled}
              className="h-full w-full border-none bg-transparent text-center text-xl font-bold italic text-gray-900 placeholder:text-gray-300 focus:outline-none uppercase"
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
              }}
            />
          )}

          {mode === "draw" && !hasContent && !isDrawing && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-gray-300">Initials</span>
            </div>
          )}
        </div>

        {/* Clear */}
        {!disabled && hasContent && (
          <button
            type="button"
            onClick={() => {
              clearCanvas();
              setTypedText("");
            }}
            className="mt-0.5 text-[8px] text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}

        {/* Hidden canvas for type mode rendering */}
        {mode === "type" && (
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE * CANVAS_SCALE}
            height={CANVAS_SIZE * CANVAS_SCALE}
            className="hidden"
          />
        )}
      </div>

      <span className="mt-2 text-xs text-gray-500">{label}</span>
    </div>
  );
}
