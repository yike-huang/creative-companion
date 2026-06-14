"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const canvasWidth = 900;
const canvasHeight = 600;

export function ArtworkDrawingCanvas({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [brushColor, setBrushColor] = useState("#2f3a3d");
  const [brushSize, setBrushSize] = useState("8");
  const [isEraser, setIsEraser] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const point = getCanvasPoint(event);
    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const point = getCanvasPoint(event);
    context.strokeStyle = isEraser ? "#ffffff" : brushColor;
    context.lineWidth = Number(brushSize);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setMessage(null);
    setError(null);
  }

  async function saveDrawing() {
    const canvas = canvasRef.current;

    if (!canvas) {
      setError("Drawing canvas is not ready.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      setError("Could not save the drawing image.");
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const imagePath = `${userId}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("artworks")
      .upload(imagePath, blob, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("artworks").insert({
      user_id: userId,
      title,
      reflection: reflection || null,
      image_path: imagePath,
      creation_method: "digital",
    });

    if (insertError) {
      await supabase.storage.from("artworks").remove([imagePath]);
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setTitle("");
    setReflection("");
    setMessage("Drawing saved.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="grid gap-5 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Draw online</h2>
        <p className="text-sm text-muted-foreground">
          Create a simple digital drawing and save it privately with a
          reflection.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="overflow-hidden rounded-md border bg-white">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="block aspect-[3/2] w-full touch-none cursor-crosshair"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        <div className="grid content-start gap-4">
          <div className="grid gap-2">
            <Label htmlFor="brush_color">Brush color</Label>
            <Input
              id="brush_color"
              type="color"
              value={brushColor}
              onChange={(event) => {
                setBrushColor(event.target.value);
                setIsEraser(false);
              }}
              className="h-10 p-1"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brush_size">Brush size: {brushSize}</Label>
            <input
              id="brush_size"
              type="range"
              min="2"
              max="36"
              value={brushSize}
              onChange={(event) => setBrushSize(event.target.value)}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={isEraser ? "default" : "outline"}
              onClick={() => setIsEraser((current) => !current)}
            >
              Eraser
            </Button>
            <Button type="button" variant="outline" onClick={clearCanvas}>
              Clear
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="digital_title">Title</Label>
            <Input
              id="digital_title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="digital_reflection">Reflection</Label>
            <textarea
              id="digital_reflection"
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What would you like to remember about this drawing?"
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            />
          </div>

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="button"
            className="w-fit"
            onClick={saveDrawing}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save drawing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
