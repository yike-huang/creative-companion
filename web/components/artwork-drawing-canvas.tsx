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
  Redo2,
  Square,
  SprayCan,
  Trash2,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const canvasWidth = 900;
const canvasHeight = 600;

type DrawingTool = "brush" | "eraser" | "fill" | "line" | "rectangle" | "ellipse";
type BrushStyle =
  | "pencil"
  | "soft"
  | "marker"
  | "airbrush"
  | "watercolor"
  | "oil"
  | "blend";
type Point = { x: number; y: number };
type Layer = {
  id: string;
  name: string;
  visible: boolean;
};
type LayerSnapshot = {
  layerId: string;
  imageData: ImageData;
};
type HistoryAction = {
  before: LayerSnapshot[];
  after: LayerSnapshot[];
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
  const previousPointRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const activeLayerIdRef = useRef("layer-1");
  const pendingHistoryRef = useRef<LayerSnapshot[] | null>(null);
  const undoStackRef = useRef<HistoryAction[]>([]);
  const redoStackRef = useRef<HistoryAction[]>([]);

  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", name: "Layer 1", visible: true },
  ]);
  const [activeLayerId, setActiveLayerId] = useState("layer-1");
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [brushColor, setBrushColor] = useState("#2f3a3d");
  const [brushColorText, setBrushColorText] = useState("#2f3a3d");
  const [brushSize, setBrushSize] = useState("8");
  const [brushOpacity, setBrushOpacity] = useState("100");
  const [brushStyle, setBrushStyle] = useState<BrushStyle>("pencil");
  const [tool, setTool] = useState<DrawingTool>("brush");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setHistoryVersion] = useState(0);
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

  function captureLayerSnapshot(layerId: string): LayerSnapshot | null {
    const layerCanvas = layersRef.current.get(layerId);
    const context = layerCanvas?.getContext("2d");

    if (!layerCanvas || !context) {
      return null;
    }

    return {
      layerId,
      imageData: context.getImageData(0, 0, layerCanvas.width, layerCanvas.height),
    };
  }

  function captureAllLayerSnapshots() {
    return layers
      .map((layer) => captureLayerSnapshot(layer.id))
      .filter((snapshot): snapshot is LayerSnapshot => snapshot !== null);
  }

  function captureAfterSnapshots(before: LayerSnapshot[]) {
    return before
      .map((snapshot) => captureLayerSnapshot(snapshot.layerId))
      .filter((snapshot): snapshot is LayerSnapshot => snapshot !== null);
  }

  function pushHistory(before: LayerSnapshot[]) {
    if (before.length === 0) {
      return;
    }

    undoStackRef.current.push({
      before,
      after: captureAfterSnapshots(before),
    });
    redoStackRef.current = [];
    setHistoryVersion((version) => version + 1);
  }

  function restoreSnapshots(snapshots: LayerSnapshot[]) {
    snapshots.forEach((snapshot) => {
      const layerCanvas = layersRef.current.get(snapshot.layerId);
      const context = layerCanvas?.getContext("2d");
      context?.putImageData(snapshot.imageData, 0, 0);
    });
    renderCanvas();
    setHistoryVersion((version) => version + 1);
  }

  function undo() {
    const action = undoStackRef.current.pop();

    if (!action) {
      return;
    }

    restoreSnapshots(action.before);
    redoStackRef.current.push(action);
  }

  function redo() {
    const action = redoStackRef.current.pop();

    if (!action) {
      return;
    }

    restoreSnapshots(action.after);
    undoStackRef.current.push(action);
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
    const size = Number(brushSize);

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = size;
    context.strokeStyle = brushColor;
    context.globalAlpha = opacity;
    context.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";
    context.shadowBlur = 0;
    context.shadowColor = "transparent";

    if (brushStyle === "soft" && tool !== "eraser") {
      context.lineWidth = size * 1.35;
      context.globalAlpha = opacity * 0.22;
    }

    if (brushStyle === "marker") {
      context.lineCap = "butt";
      context.lineJoin = "round";
      context.globalAlpha = opacity * 0.75;
    }

    if (brushStyle === "watercolor" && tool !== "eraser") {
      context.lineWidth = size * 1.55;
      context.globalAlpha = opacity * 0.24;
      context.globalCompositeOperation = "multiply";
    }

    if (brushStyle === "oil" && tool !== "eraser") {
      context.lineWidth = size * 1.65;
      context.globalAlpha = opacity * 0.88;
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

  function drawWatercolorCurve(
    context: CanvasRenderingContext2D,
    startPoint: Point,
    controlPoint: Point,
    endPoint: Point,
  ) {
    context.beginPath();
    context.moveTo(startPoint.x, startPoint.y);
    context.quadraticCurveTo(
      controlPoint.x,
      controlPoint.y,
      endPoint.x,
      endPoint.y,
    );
    context.stroke();
  }

  function drawImpastoCurve(
    context: CanvasRenderingContext2D,
    startPoint: Point,
    controlPoint: Point,
    endPoint: Point,
    offsetX = 0,
    offsetY = 0,
  ) {
    context.beginPath();
    context.moveTo(startPoint.x + offsetX, startPoint.y + offsetY);
    context.quadraticCurveTo(
      controlPoint.x + offsetX,
      controlPoint.y + offsetY,
      endPoint.x + offsetX,
      endPoint.y + offsetY,
    );
    context.stroke();
  }

  function drawOilStroke(
    context: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    const size = Number(brushSize);
    const opacity = Number(brushOpacity) / 100;
    const previousPoint = previousPointRef.current ?? from;
    const controlPoint = from;
    const endPoint = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
    };
    const startPoint = {
      x: (previousPoint.x + from.x) / 2,
      y: (previousPoint.y + from.y) / 2,
    };
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;

    context.save();
    context.globalCompositeOperation = "source-over";
    context.lineCap = "butt";
    context.lineJoin = "round";
    context.strokeStyle = brushColor;
    context.globalAlpha = opacity * 0.92;
    context.lineWidth = size * 1.9;
    drawImpastoCurve(context, startPoint, controlPoint, endPoint);

    context.globalAlpha = opacity * 0.28;
    context.lineWidth = Math.max(1, size * 0.22);
    context.strokeStyle = "rgba(255, 255, 255, 0.72)";

    [-0.42, -0.14, 0.18, 0.43].forEach((ridge, index) => {
      const wobble = Math.sin((from.x + from.y + index * 37) * 0.08) * size * 0.035;
      drawImpastoCurve(
        context,
        startPoint,
        controlPoint,
        endPoint,
        normalX * size * ridge + wobble,
        normalY * size * ridge - wobble,
      );
    });

    context.globalAlpha = opacity * 0.18;
    context.lineWidth = Math.max(1, size * 0.18);
    context.strokeStyle = "rgba(0, 0, 0, 0.28)";

    [-0.3, 0.32].forEach((ridge, index) => {
      const wobble = Math.cos((from.x - from.y + index * 29) * 0.07) * size * 0.03;
      drawImpastoCurve(
        context,
        startPoint,
        controlPoint,
        endPoint,
        normalX * size * ridge - wobble,
        normalY * size * ridge + wobble,
      );
    });

    context.restore();
  }

  function blendStroke(
    context: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    const size = Number(brushSize);
    const opacity = Number(brushOpacity) / 100;
    const radius = Math.max(8, size * 1.6);
    const diameter = radius * 2;
    const sourceCanvas = context.canvas;
    const smudgeCanvas = document.createElement("canvas");
    const smudgeContext = smudgeCanvas.getContext("2d");

    if (!smudgeContext) {
      return;
    }

    smudgeCanvas.width = diameter;
    smudgeCanvas.height = diameter;
    smudgeContext.drawImage(
      sourceCanvas,
      from.x - radius,
      from.y - radius,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter,
    );

    context.save();
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = Math.min(0.72, opacity * 0.58);
    context.filter = `blur(${Math.max(1, size * 0.08)}px)`;
    context.drawImage(smudgeCanvas, to.x - radius, to.y - radius);
    context.filter = "none";
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

    if (brushStyle === "blend" && tool !== "eraser") {
      blendStroke(context, from, to);
      return;
    }

    configureStroke(context);

    if (brushStyle === "watercolor" && tool !== "eraser") {
      const size = Number(brushSize);
      const opacity = Number(brushOpacity) / 100;
      const previousPoint = previousPointRef.current ?? from;
      const controlPoint = from;
      const endPoint = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
      };
      const startPoint = {
        x: (previousPoint.x + from.x) / 2,
        y: (previousPoint.y + from.y) / 2,
      };

      context.save();
      context.globalCompositeOperation = "multiply";
      context.strokeStyle = brushColor;
      context.lineCap = "butt";
      context.lineJoin = "round";
      context.globalAlpha = opacity * 0.085;
      context.lineWidth = size * 3.6;
      drawWatercolorCurve(context, startPoint, controlPoint, endPoint);

      context.globalAlpha = opacity * 0.12;
      context.lineWidth = size * 2.45;
      drawWatercolorCurve(context, startPoint, controlPoint, endPoint);

      context.globalAlpha = opacity * 0.045;
      context.lineWidth = size * 1.05;
      drawWatercolorCurve(context, startPoint, controlPoint, endPoint);

      context.globalAlpha = opacity * 0.085;
      context.lineWidth = Math.max(0.8, size * 0.22);

      for (let index = 0; index < 4; index += 1) {
        const edge = index % 2 === 0 ? 1 : -1;
        const offset = edge * (size * (0.65 + Math.random() * 0.75));
        const drift = (Math.random() - 0.5) * size * 0.35;

        drawWatercolorCurve(
          context,
          { x: startPoint.x + offset, y: startPoint.y + drift },
          { x: controlPoint.x + offset * 0.82, y: controlPoint.y + drift },
          { x: endPoint.x + offset, y: endPoint.y + drift },
        );
      }
      context.restore();
    } else if (brushStyle === "oil" && tool !== "eraser") {
      drawOilStroke(context, from, to);
    } else {
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.shadowBlur = 0;
    context.shadowColor = "transparent";
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
      const before = captureLayerSnapshot(activeLayerIdRef.current);
      fillLayer(context);
      renderCanvas();
      if (before) {
        pushHistory([before]);
      }
      return;
    }

    isDrawingRef.current = true;
    startPointRef.current = point;
    previousPointRef.current = point;
    lastPointRef.current = point;
    const before = captureLayerSnapshot(activeLayerIdRef.current);
    pendingHistoryRef.current = before ? [before] : null;
    canvas.setPointerCapture(event.pointerId);

    if (
      (tool === "brush" && brushStyle !== "soft") ||
      tool === "eraser"
    ) {
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
      previousPointRef.current = lastPoint;
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

    if (pendingHistoryRef.current) {
      pushHistory(pendingHistoryRef.current);
    }

    isDrawingRef.current = false;
    startPointRef.current = null;
    previousPointRef.current = null;
    lastPointRef.current = null;
    pendingHistoryRef.current = null;
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
    const before = captureLayerSnapshot(id);
    const layerCanvas = layersRef.current.get(id);
    const context = layerCanvas?.getContext("2d");

    if (!layerCanvas || !context) {
      return;
    }

    context.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
    setMessage(null);
    setError(null);
    renderCanvas();
    if (before) {
      pushHistory([before]);
    }
  }

  function clearAllLayers() {
    const before = captureAllLayerSnapshots();
    layersRef.current.forEach((layerCanvas) => {
      const context = layerCanvas.getContext("2d");
      context?.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
    });
    setMessage(null);
    setError(null);
    renderCanvas();
    pushHistory(before);
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
  const activeToolLabel =
    tools.find((item) => item.id === tool)?.label ?? "Brush";

  return (
    <div
      ref={rootRef}
      className={
        isFullscreen
          ? "grid h-screen gap-5 overflow-auto bg-background p-5"
          : "grid gap-5 rounded-md border bg-background p-5"
      }
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold">Draw online</h2>
          <p className="text-sm text-muted-foreground">
            Here you can make a digital drawing with layers, brush styles,
            color, and simple shapes. If you want, you can save it privately
            with a reflection.
          </p>
          <p className="text-xs text-muted-foreground">
            Current tool: {activeToolLabel} · {brushStyle} · {brushSize}px ·{" "}
            {brushOpacity}% opacity
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStackRef.current.length === 0}
            >
              <Undo2 />
              Undo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={redoStackRef.current.length === 0}
            >
              <Redo2 />
              Redo
            </Button>
          </div>

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
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "pencil",
                  "soft",
                  "marker",
                  "airbrush",
                  "watercolor",
                  "oil",
                  "blend",
                ] as BrushStyle[]
              ).map((style) => (
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
            <div className="grid grid-cols-[4rem_1fr] gap-2">
              <Input
                id="brush_color"
                type="color"
                value={brushColor}
                onChange={(event) => {
                  setBrushColor(event.target.value);
                  setBrushColorText(event.target.value);
                }}
                className="h-10 p-1"
              />
              <Input
                aria-label="Color hex value"
                value={brushColorText}
                onChange={(event) => {
                  const value = event.target.value;
                  const nextValue = value.startsWith("#") ? value : `#${value}`;
                  setBrushColorText(nextValue);
                  if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) {
                    setBrushColor(nextValue);
                  }
                }}
                onBlur={() => {
                  setBrushColorText(brushColor);
                }}
                placeholder="#2f3a3d"
              />
            </div>
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
