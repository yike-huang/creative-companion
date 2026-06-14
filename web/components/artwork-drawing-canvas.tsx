"use client";

import {
  Circle,
  Eraser,
  Eye,
  EyeOff,
  Minus,
  Maximize2,
  Minimize2,
  PaintBucket,
  Paintbrush,
  PenLine,
  Plus,
  Square,
  SprayCan,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const canvasWidth = 900;
const canvasHeight = 600;

type DrawingTool = "brush" | "eraser" | "fill" | "line" | "rectangle" | "ellipse";
type BrushStyle = "pencil" | "soft" | "marker" | "airbrush";
type Point = { x: number; y: number };
type Layer = {
  id: string;
  name: string;
  visible: boolean;
};

function createLayerCanvas() {
  const layer = document.createElement("canvas");
  layer.width = canvasWidth;
  layer.height = canvasHeight;
  return layer;
}

export function ArtworkDrawingCanvas({ userId }: { userId: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layersRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const activeLayerIdRef = useRef("layer-1");

  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", name: "Layer 1", visible: true },
  ]);
  const [activeLayerId, setActiveLayerId] = useState("layer-1");
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [brushColor, setBrushColor] = useState("#2f3a3d");
  const [brushSize, setBrushSize] = useState("8");
  const [brushOpacity, setBrushOpacity] = useState("100");
  const [brushStyle, setBrushStyle] = useState<BrushStyle>("pencil");
  const [tool, setTool] = useState<DrawingTool>("brush");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();

  const renderCanvas = useCallback((currentLayers = layers) => {
    const displayCanvas = canvasRef.current;
    const context = displayCanvas?.getContext("2d");

    if (!displayCanvas || !context) {
      return;
    }

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    currentLayers.forEach((layer) => {
      const layerCanvas = layersRef.current.get(layer.id);
      if (layer.visible && layerCanvas) {
        context.drawImage(layerCanvas, 0, 0);
      }
    });

    context.restore();
  }, [layers]);

  useEffect(() => {
    const displayCanvas = canvasRef.current;
    const context = displayCanvas?.getContext("2d");

    if (!displayCanvas || !context) {
      return;
    }

    if (!layersRef.current.has("layer-1")) {
      layersRef.current.set("layer-1", createLayerCanvas());
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    renderCanvas(layers);
  }, [layers, renderCanvas]);

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function getActiveLayerContext() {
    const layerCanvas = layersRef.current.get(activeLayerIdRef.current);
    return layerCanvas?.getContext("2d") ?? null;
  }

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

  function configureStroke(context: CanvasRenderingContext2D) {
    const opacity = Number(brushOpacity) / 100;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Number(brushSize);
    context.strokeStyle = brushColor;
    context.globalAlpha = brushStyle === "soft" ? opacity * 0.35 : opacity;
    context.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";

    if (brushStyle === "marker") {
      context.lineCap = "butt";
      context.lineJoin = "round";
      context.globalAlpha = opacity * 0.75;
    }
  }

  function sprayAt(context: CanvasRenderingContext2D, point: Point) {
    const radius = Number(brushSize) * 1.8;
    const droplets = Math.max(12, Number(brushSize) * 3);
    const opacity = Number(brushOpacity) / 100;

    context.save();
    context.fillStyle = brushColor;
    context.globalAlpha = opacity * 0.16;
    context.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";

    for (let index = 0; index < droplets; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      const x = point.x + Math.cos(angle) * distance;
      const y = point.y + Math.sin(angle) * distance;
      const dotSize = Math.max(1, Number(brushSize) / 10);

      context.beginPath();
      context.arc(x, y, dotSize, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  function fillLayer(context: CanvasRenderingContext2D) {
    context.save();
    context.globalAlpha = Number(brushOpacity) / 100;
    context.globalCompositeOperation = "source-over";
    context.fillStyle = brushColor;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.restore();
  }

  function strokeBetween(
    context: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    if (brushStyle === "airbrush" && tool !== "eraser") {
      sprayAt(context, to);
      return;
    }

    configureStroke(context);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  function drawShape(
    context: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    preview = false,
  ) {
    configureStroke(context);

    if (preview) {
      context.globalAlpha = 0.75;
      context.setLineDash([8, 6]);
    }

    context.beginPath();

    if (tool === "line") {
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
    }

    if (tool === "rectangle") {
      context.rect(from.x, from.y, to.x - from.x, to.y - from.y);
    }

    if (tool === "ellipse") {
      const centerX = (from.x + to.x) / 2;
      const centerY = (from.y + to.y) / 2;
      const radiusX = Math.abs(to.x - from.x) / 2;
      const radiusY = Math.abs(to.y - from.y) / 2;
      context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    }

    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = getActiveLayerContext();

    if (!canvas || !context) {
      return;
    }

    const point = getCanvasPoint(event);

    if (tool === "fill") {
      fillLayer(context);
      renderCanvas();
      return;
    }

    isDrawingRef.current = true;
    startPointRef.current = point;
    lastPointRef.current = point;
    canvas.setPointerCapture(event.pointerId);

    if (tool === "brush" || tool === "eraser") {
      strokeBetween(context, point, point);
      renderCanvas();
    }
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const layerContext = getActiveLayerContext();
    const displayContext = canvasRef.current?.getContext("2d");
    const currentPoint = getCanvasPoint(event);
    const lastPoint = lastPointRef.current;
    const startPoint = startPointRef.current;

    if (!layerContext || !displayContext || !lastPoint || !startPoint) {
      return;
    }

    if (tool === "brush" || tool === "eraser") {
      strokeBetween(layerContext, lastPoint, currentPoint);
      lastPointRef.current = currentPoint;
      renderCanvas();
      return;
    }

    renderCanvas();
    drawShape(displayContext, startPoint, currentPoint, true);
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const layerContext = getActiveLayerContext();
    const startPoint = startPointRef.current;
    const endPoint = getCanvasPoint(event);

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (
      layerContext &&
      startPoint &&
      (tool === "line" || tool === "rectangle" || tool === "ellipse")
    ) {
      drawShape(layerContext, startPoint, endPoint);
      renderCanvas();
    }

    isDrawingRef.current = false;
    startPointRef.current = null;
    lastPointRef.current = null;
  }

  function addLayer() {
    const id = crypto.randomUUID();
    layersRef.current.set(id, createLayerCanvas());
    setLayers((current) => {
      const next = [
        ...current,
        { id, name: `Layer ${current.length + 1}`, visible: true },
      ];
      return next;
    });
    setActiveLayerId(id);
  }

  function toggleLayerVisibility(id: string) {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  }

  function deleteLayer(id: string) {
    setLayers((current) => {
      if (current.length === 1) {
        clearLayer(id);
        return current;
      }

      const next = current.filter((layer) => layer.id !== id);
      layersRef.current.delete(id);
      if (activeLayerIdRef.current === id) {
        const nextActiveId = next[next.length - 1].id;
        setActiveLayerId(nextActiveId);
      }
      return next;
    });
  }

  function clearLayer(id = activeLayerId) {
    const layerCanvas = layersRef.current.get(id);
    const context = layerCanvas?.getContext("2d");

    if (!layerCanvas || !context) {
      return;
    }

    context.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
    setMessage(null);
    setError(null);
    renderCanvas();
  }

  function clearAllLayers() {
    layersRef.current.forEach((layerCanvas) => {
      const context = layerCanvas.getContext("2d");
      context?.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
    });
    setMessage(null);
    setError(null);
    renderCanvas();
  }

  function exportCanvas() {
    const exportCanvasElement = document.createElement("canvas");
    const context = exportCanvasElement.getContext("2d");

    exportCanvasElement.width = canvasWidth;
    exportCanvasElement.height = canvasHeight;

    if (!context) {
      return null;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    layers.forEach((layer) => {
      const layerCanvas = layersRef.current.get(layer.id);
      if (layer.visible && layerCanvas) {
        context.drawImage(layerCanvas, 0, 0);
      }
    });

    return exportCanvasElement;
  }

  async function saveDrawing() {
    const exportCanvasElement = exportCanvas();

    if (!exportCanvasElement) {
      setError("Drawing canvas is not ready.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    const blob = await new Promise<Blob | null>((resolve) => {
      exportCanvasElement.toBlob(resolve, "image/png");
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

  async function toggleFullscreen() {
    if (!rootRef.current) {
      return;
    }

    if (document.fullscreenElement === rootRef.current) {
      await document.exitFullscreen();
    } else {
      await rootRef.current.requestFullscreen();
    }
  }

  const tools: Array<{
    id: DrawingTool;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "brush", label: "Brush", icon: <Paintbrush /> },
    { id: "eraser", label: "Eraser", icon: <Eraser /> },
    { id: "fill", label: "Fill layer", icon: <PaintBucket /> },
    { id: "line", label: "Line", icon: <Minus /> },
    { id: "rectangle", label: "Rectangle", icon: <Square /> },
    { id: "ellipse", label: "Ellipse", icon: <Circle /> },
  ];

  return (
    <div
      ref={rootRef}
      className="grid gap-5 rounded-md border bg-background p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold">Draw online</h2>
          <p className="text-sm text-muted-foreground">
            Create a digital drawing with layers, brush styles, lines, and
            simple shapes, then save it privately with a reflection.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </Button>
      </div>

      <div
        className={
          isFullscreen
            ? "grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_18rem]"
            : "grid gap-4 xl:grid-cols-[1fr_18rem]"
        }
      >
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

        <div className="grid content-start gap-5">
          <div className="grid gap-2">
            <Label>Tools</Label>
            <div className="grid grid-cols-6 gap-2 xl:grid-cols-3">
              {tools.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={tool === item.id ? "default" : "outline"}
                  size="icon"
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => setTool(item.id)}
                >
                  {item.icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Brush style</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["pencil", "soft", "marker", "airbrush"] as BrushStyle[]).map((style) => (
                <Button
                  key={style}
                  type="button"
                  variant={brushStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrushStyle(style)}
                >
                  {style === "airbrush" && <SprayCan />}
                  {style}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brush_color">Color</Label>
            <Input
              id="brush_color"
              type="color"
              value={brushColor}
              onChange={(event) => setBrushColor(event.target.value)}
              className="h-10 p-1"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brush_size">Brush size: {brushSize}</Label>
            <input
              id="brush_size"
              type="range"
              min="2"
              max="44"
              value={brushSize}
              onChange={(event) => setBrushSize(event.target.value)}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brush_opacity">Opacity: {brushOpacity}%</Label>
            <input
              id="brush_opacity"
              type="range"
              min="5"
              max="100"
              value={brushOpacity}
              onChange={(event) => setBrushOpacity(event.target.value)}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Layers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLayer}
              >
                <Plus />
                Add
              </Button>
            </div>
            <div className="grid gap-2">
              {layers
                .slice()
                .reverse()
                .map((layer) => (
                  <div
                    key={layer.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border p-2"
                  >
                    <Button
                      type="button"
                      variant={activeLayerId === layer.id ? "default" : "ghost"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setActiveLayerId(layer.id)}
                    >
                      <PenLine />
                      {layer.name}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={layer.visible ? "Hide layer" : "Show layer"}
                      aria-label={layer.visible ? "Hide layer" : "Show layer"}
                      onClick={() => toggleLayerVisibility(layer.id)}
                    >
                      {layer.visible ? <Eye /> : <EyeOff />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete layer"
                      aria-label="Delete layer"
                      onClick={() => deleteLayer(layer.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => clearLayer()}
            >
              Clear layer
            </Button>
            <Button type="button" variant="outline" onClick={clearAllLayers}>
              Clear all
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
