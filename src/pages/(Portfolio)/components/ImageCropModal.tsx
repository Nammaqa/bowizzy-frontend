import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";

interface ImageCropModalProps {
  /** The picked file, before any upload happens. */
  file: File;
  onCancel: () => void;
  onCropped: (croppedFile: File) => void | Promise<void>;
  /** Disables the controls while the caller uploads the result. */
  busy?: boolean;
  /** Shape of the crop window. Circle still produces a square file. */
  shape?: "circle" | "square";
  /** Width/height of the exported image, in pixels. */
  outputSize?: number;
  title?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function ImageCropModal({
  file,
  onCancel,
  onCropped,
  busy = false,
  shape = "circle",
  outputSize = 512,
  title = "Crop image",
}: ImageCropModalProps) {
  const [objectUrl, setObjectUrl] = useState("");
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [boxSize, setBoxSize] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The crop maths need the rendered box size, which is responsive.
  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;

    const update = () => setBoxSize(element.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [objectUrl]);

  /** Scale at which the image exactly covers the crop box. */
  const baseScale =
    naturalSize && boxSize
      ? boxSize / Math.min(naturalSize.width, naturalSize.height)
      : 1;
  const scale = baseScale * zoom;

  /** How far the image may travel before a gap would show at an edge. */
  const getMaxOffset = useCallback(
    (nextScale: number) => {
      if (!naturalSize || !boxSize) return { x: 0, y: 0 };
      return {
        x: Math.max(0, (naturalSize.width * nextScale - boxSize) / 2),
        y: Math.max(0, (naturalSize.height * nextScale - boxSize) / 2),
      };
    },
    [naturalSize, boxSize]
  );

  const clampOffset = useCallback(
    (next: { x: number; y: number }, nextScale: number) => {
      const max = getMaxOffset(nextScale);
      return {
        x: clamp(next.x, -max.x, max.x),
        y: clamp(next.y, -max.y, max.y),
      };
    },
    [getMaxOffset]
  );

  const applyZoom = (nextZoom: number) => {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    setZoom(clampedZoom);
    setOffset((current) => clampOffset(current, baseScale * clampedZoom));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (busy || processing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: offset.x,
      y: offset.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current;
    if (!origin) return;
    setOffset(
      clampOffset(
        {
          x: origin.x + (event.clientX - origin.pointerX),
          y: origin.y + (event.clientY - origin.pointerY),
        },
        scale
      )
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragOrigin.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragOrigin.current = null;
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (busy || processing) return;
    applyZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  };

  const handleConfirm = async () => {
    const image = imageRef.current;
    if (!image || !naturalSize || !boxSize) return;

    setProcessing(true);
    try {
      // Top-left of the drawn image, in crop-box coordinates.
      const imageLeft = boxSize / 2 + offset.x - (naturalSize.width * scale) / 2;
      const imageTop = boxSize / 2 + offset.y - (naturalSize.height * scale) / 2;

      // The visible square, converted back into source pixels.
      const sourceX = -imageLeft / scale;
      const sourceY = -imageTop / scale;
      const sourceSize = boxSize / scale;

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available");

      // PNG sources may be transparent; anything else is flattened onto white
      // so a JPEG export never gains a black background.
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      if (outputType !== "image/png") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, outputSize, outputSize);
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        outputSize,
        outputSize
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outputType, 0.92)
      );
      if (!blob) throw new Error("Could not read the cropped image");

      const extension = outputType === "image/png" ? "png" : "jpg";
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      await onCropped(
        new File([blob], `${baseName}-cropped.${extension}`, { type: outputType })
      );
    } catch (error) {
      console.error("Cropping failed", error);
      alert("Unable to crop this image. Please try another one.");
    } finally {
      setProcessing(false);
    }
  };

  const disabled = busy || processing;
  const ready = !!naturalSize && boxSize > 0 && !loadError;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Cancel cropping"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {loadError ? (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              This file could not be opened as an image. Please choose another.
            </p>
          ) : (
            <>
              <div
                ref={boxRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onWheel={handleWheel}
                className={`relative mx-auto aspect-square w-full max-w-[280px] touch-none overflow-hidden bg-gray-900 select-none ${
                  shape === "circle" ? "rounded-full" : "rounded-xl"
                } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
              >
                {objectUrl && (
                  <img
                    ref={imageRef}
                    src={objectUrl}
                    alt="Crop preview"
                    draggable={false}
                    onLoad={(event) => {
                      const target = event.currentTarget;
                      setNaturalSize({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      });
                      setOffset({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    onError={() => setLoadError(true)}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: naturalSize ? naturalSize.width * scale : undefined,
                      height: naturalSize ? naturalSize.height * scale : undefined,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                      maxWidth: "none",
                    }}
                  />
                )}
              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-gray-400">
                Drag to reposition · scroll or use the slider to zoom
              </p>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyZoom(zoom - ZOOM_STEP)}
                  disabled={disabled || !ready || zoom <= MIN_ZOOM}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  disabled={disabled || !ready}
                  onChange={(event) => applyZoom(Number(event.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-violet-600 disabled:opacity-40"
                  aria-label="Zoom"
                />
                <button
                  type="button"
                  onClick={() => applyZoom(zoom + ZOOM_STEP)}
                  disabled={disabled || !ready || zoom >= MAX_ZOOM}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={disabled || !ready}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-200 transition hover:from-violet-700 hover:to-violet-600 disabled:opacity-50"
          >
            {disabled && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {busy ? "Uploading…" : processing ? "Cropping…" : "Crop & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
