import { useRef, useState, type ChangeEvent } from "react";
import { ImageOff, ImagePlus, Trash2 } from "lucide-react";
import type { HybridImage } from "@/types/hybridGuide";
import { TextField } from "@/components/hybrid/HybridFieldControls";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface HybridImageFieldProps {
  label: string;
  image: HybridImage;
  onChange: (image: HybridImage) => void;
}

export function HybridImageField({ label, image, onChange }: HybridImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState("");
  const isLocalFile = !!image.url?.startsWith("data:");

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileError("");
      if (typeof reader.result === "string") onChange({ ...image, url: reader.result });
    };
    reader.onerror = () => setFileError("Não foi possível ler esse arquivo.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>

      <div className="flex h-36 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-background">
        {image.url ? (
          <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <ImageOff className="h-5 w-5" /> Sem imagem
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
        >
          <ImagePlus className="h-3.5 w-3.5" /> Replace Image
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...image, url: null })}
          disabled={!image.url}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove Image
        </button>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleFile} className="hidden" />
      {fileError && <p className="text-xs text-red-600">{fileError}</p>}

      <TextField
        label="Ou cole a URL de uma imagem"
        value={isLocalFile ? "" : image.url ?? ""}
        placeholder={isLocalFile ? "Imagem enviada do seu dispositivo" : "https://..."}
        onChange={(v) => onChange({ ...image, url: v.trim() || null })}
      />
      <TextField
        label="Texto alternativo (Alt Text)"
        value={image.alt}
        onChange={(v) => onChange({ ...image, alt: v })}
      />
    </div>
  );
}
