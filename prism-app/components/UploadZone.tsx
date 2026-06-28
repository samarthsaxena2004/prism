"use client";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Zap } from "lucide-react";

interface Props {
  image: string | null;
  imageName: string;
  running: boolean;
  onFile: (b64: string, name: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export default function UploadZone({ image, imageName, running, onFile, onAnalyze, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Strip the data:image/...;base64, prefix
      const b64 = result.split(",")[1];
      onFile(b64, file.name);
    };
    reader.readAsDataURL(file);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className="relative rounded-xl border border-white/10 bg-[#0e0f1a] p-5 transition-colors"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      {!image ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-3 py-8 text-[#454e70] hover:text-[#8a94b8] transition-colors cursor-pointer"
        >
          <Upload className="h-8 w-8" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop a form image here</p>
            <p className="text-xs mt-1">or click to browse · JPG, PNG, WEBP</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/jpeg;base64,${image}`}
            alt="form preview"
            className="h-20 w-20 object-cover rounded-lg border border-white/10 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e8eaf6] truncate font-medium">{imageName}</p>
            <p className="text-xs text-[#454e70] mt-0.5">Ready to investigate</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!running && (
              <button
                onClick={onClear}
                className="p-1.5 text-[#454e70] hover:text-[#e8eaf6] transition-colors"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              onClick={onAnalyze}
              disabled={running}
              className="bg-[#4ade80] text-[#06060f] hover:bg-[#22c55e] font-semibold text-sm gap-1.5 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              {running ? "Running..." : "Investigate"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
