import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  ownerId: string;
  /** Subfolder under ownerId/, e.g. "profile" or "patients/<id>" */
  pathPrefix?: string;
  fallback?: string;
  size?: number;
};

export function AvatarUpload({
  value,
  onChange,
  ownerId,
  pathPrefix = "profile",
  fallback = "?",
  size = 96,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${ownerId}/${pathPrefix}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Foto atualizada");
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative rounded-full overflow-hidden bg-gradient-brand grid place-items-center text-white font-medium shrink-0 border border-border/60"
        style={{ width: size, height: size, fontSize: size / 3 }}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          fallback.charAt(0).toUpperCase()
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border/60 bg-surface hover:bg-surface-elevated text-xs transition-colors disabled:opacity-60"
        >
          <Camera className="h-3.5 w-3.5" />
          {value ? "Trocar foto" : "Enviar foto"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
