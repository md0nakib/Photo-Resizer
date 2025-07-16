"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UploadCloud,
  Download,
  Lock,
  Unlock,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OutputFormat = "jpeg" | "png" | "webp" | "gif" | "bmp";

export default function RTPhotoConverterApp() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg");
  const [outputWidth, setOutputWidth] = useState<number>(0);
  const [outputHeight, setOutputHeight] = useState<number>(0);
  const [outputQuality, setOutputQuality] = useState<number>(85);
  const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);

  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }
      setSourceFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          setSourceDimensions({ width: img.width, height: img.height });
          setOutputWidth(img.width);
          setOutputHeight(img.height);
          setSourcePreview(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDimensionChange = (
    value: string,
    dimension: "width" | "height"
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) return;

    if (
      maintainAspectRatio &&
      sourceDimensions &&
      sourceDimensions.width > 0 &&
      sourceDimensions.height > 0
    ) {
      const aspectRatio = sourceDimensions.width / sourceDimensions.height;
      if (dimension === "width") {
        setOutputWidth(numValue);
        setOutputHeight(Math.round(numValue / aspectRatio));
      } else {
        setOutputHeight(numValue);
        setOutputWidth(Math.round(numValue * aspectRatio));
      }
    } else {
      if (dimension === "width") {
        setOutputWidth(numValue);
      } else {
        setOutputHeight(numValue);
      }
    }
  };

  const generatePreview = useCallback(async () => {
    if (!sourcePreview) return;
    setIsProcessing(true);
    try {
      const img = document.createElement("img");
      img.src = sourcePreview;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // For formats that don't support transparency, fill with white
      if (outputFormat === 'jpeg' || outputFormat === 'bmp') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      }

      ctx.drawImage(img, 0, 0, outputWidth, outputHeight);

      const mimeType = `image/${outputFormat}`;
      const quality =
        outputFormat === "jpeg" || outputFormat === "webp"
          ? outputQuality / 100
          : undefined;
          
      // GIF and BMP do not support quality parameter in toDataURL
      const dataUrl = canvas.toDataURL(mimeType, (outputFormat === 'jpeg' || outputFormat === 'webp') ? quality : undefined);
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality));

      setConvertedPreview(dataUrl);
      setConvertedSize(blob?.size ?? 0);
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion Failed",
        description: "Could not generate image preview. The target format might not be supported by your browser.",
        variant: "destructive",
      });
      setConvertedPreview(null);
      setConvertedSize(null);
    } finally {
      setIsProcessing(false);
    }
  }, [
    sourcePreview,
    outputWidth,
    outputHeight,
    outputFormat,
    outputQuality,
    toast,
  ]);

  useEffect(() => {
    if (sourceFile) {
      generatePreview();
    }
  }, [sourceFile, outputFormat, outputWidth, outputHeight, outputQuality, generatePreview]);

  const handleDownload = () => {
    if (!convertedPreview) return;
    const link = document.createElement("a");
    link.href = convertedPreview;
    const originalName = sourceFile?.name.split(".").slice(0, -1).join(".") || "image";
    link.download = `${originalName}_converted.${outputFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!sourceFile) {
    return (
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">
            RT Photo Convertor
          </CardTitle>
          <CardDescription>
            Convert and optimize your images with ease.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
            onClick={triggerFileInput}
            onDrop={(e) => {
              e.preventDefault();
              handleFileChange({
                target: { files: e.dataTransfer.files },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <UploadCloud className="w-12 h-12 text-primary" />
            <p className="mt-4 text-lg font-medium">
              Click to upload or drag & drop
            </p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, GIF, WebP, BMP supported
            </p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Preview Column */}
      <div className="space-y-4 lg:sticky top-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Image Preview</CardTitle>
            <CardDescription>Compare original and converted images.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="text-center space-y-2">
                <h3 className="font-semibold">Original</h3>
                {sourcePreview && <Image src={sourcePreview} alt="Original" width={sourceDimensions?.width || 300} height={sourceDimensions?.height || 300} className="rounded-md object-contain w-full h-auto" />}
                <p className="text-sm text-muted-foreground">{sourceDimensions?.width} x {sourceDimensions?.height}px - {(sourceFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <div className="text-center space-y-2 relative">
                <h3 className="font-semibold">Converted</h3>
                {isProcessing && <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                {convertedPreview ? <Image src={convertedPreview} alt="Converted" width={outputWidth} height={outputHeight} className="rounded-md object-contain w-full h-auto" /> : <div className="h-full w-full bg-muted rounded-md flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>}
                <p className="text-sm text-muted-foreground">{outputWidth} x {outputHeight}px - {convertedSize ? (convertedSize / 1024).toFixed(1) + " KB" : "..."}</p>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => { setSourceFile(null); setSourcePreview(null); }} variant="outline" className="w-full">Upload Another Image</Button>
      </div>
      {/* Settings Column */}
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Conversion Settings</CardTitle>
            <CardDescription>
              Adjust format, dimensions, and quality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Tabs
                value={outputFormat}
                onValueChange={(v) => setOutputFormat(v as OutputFormat)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="jpeg">JPG</TabsTrigger>
                  <TabsTrigger value="png">PNG</TabsTrigger>
                  <TabsTrigger value="webp">WebP</TabsTrigger>
                  <TabsTrigger value="gif">GIF</TabsTrigger>
                  <TabsTrigger value="bmp">BMP</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
                <Label>Dimensions (px)</Label>
                <div className="flex items-center gap-2">
                    <Input id="width" type="number" value={outputWidth} onChange={e => handleDimensionChange(e.target.value, "width")} placeholder="Width" />
                    <span className="text-muted-foreground">x</span>
                    <Input id="height" type="number" value={outputHeight} onChange={e => handleDimensionChange(e.target.value, "height")} placeholder="Height" />
                    <Button variant="ghost" size="icon" onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}>
                        {maintainAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        <span className="sr-only">Toggle aspect ratio lock</span>
                    </Button>
                </div>
            </div>
            {(outputFormat === "jpeg" || outputFormat === "webp") && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Quality</Label>
                  <span className="text-sm text-muted-foreground">{outputQuality}%</span>
                </div>
                <Slider
                  value={[outputQuality]}
                  onValueChange={(v) => setOutputQuality(v[0])}
                  max={100}
                  step={1}
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleDownload} disabled={isProcessing || !convertedPreview} className="w-full text-lg py-6">
                {isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
                Download Converted Image
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
