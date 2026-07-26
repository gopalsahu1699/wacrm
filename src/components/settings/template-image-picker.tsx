'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2, Image as ImageIcon, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import {
  uploadTemplateImage,
  listTemplateImages,
  deleteTemplateImage,
  MAX_BYTES,
} from '@/lib/storage/upload-template-image';

interface TemplateImagePickerProps {
  value: string;
  onChange: (url: string) => void;
}

export function TemplateImagePicker({ value, onChange }: TemplateImagePickerProps) {
  const t = useTranslations('Settings.templates');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<
    { publicUrl: string; path: string; name: string; created_at: string }[]
  >([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [urlInput, setUrlInput] = useState(value);

  const fetchImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const result = await listTemplateImages();
      setImages(result);
    } catch {
      // silent
    } finally {
      setLoadingImages(false);
    }
  }, []);

  useEffect(() => {
    if (showGallery) {
      fetchImages();
    }
  }, [showGallery, fetchImages]);

  useEffect(() => {
    setUrlInput(value);
  }, [value]);

  async function handleFile(file: File) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPEG and PNG images are supported.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`Image too large. Maximum size is 5 MB.`);
      return;
    }
    setUploading(true);
    try {
      const { publicUrl } = await uploadTemplateImage(file);
      onChange(publicUrl);
      setUrlInput(publicUrl);
      toast.success('Image uploaded successfully.');
      fetchImages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(path: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteTemplateImage(path);
      setImages((prev) => prev.filter((img) => img.path !== path));
      if (value === images.find((img) => img.path === path)?.publicUrl) {
        onChange('');
        setUrlInput('');
      }
      toast.success('Image deleted.');
    } catch {
      toast.error('Failed to delete image.');
    }
  }

  function handleUrlChange(url: string) {
    setUrlInput(url);
    onChange(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowGallery(!showGallery)}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {showGallery ? 'Close Gallery' : 'Select from Gallery'}
        </Button>
        <span className="text-xs text-muted-foreground">JPEG or PNG, max 5MB</span>
      </div>

      {showGallery && (
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Previously uploaded images</p>
              {loadingImages && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            </div>
            {images.length === 0 && !loadingImages ? (
              <p className="text-xs text-muted-foreground text-center py-4">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {images.map((img) => (
                  <div
                    key={img.path}
                    className={`relative group rounded-md overflow-hidden border-2 cursor-pointer aspect-square ${
                      value === img.publicUrl
                        ? 'border-primary'
                        : 'border-transparent hover:border-border'
                    }`}
                    onClick={() => {
                      onChange(img.publicUrl);
                      setUrlInput(img.publicUrl);
                      setShowGallery(false);
                    }}
                  >
                    <img
                      src={img.publicUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    {value === img.publicUrl && (
                      <div className="absolute top-0.5 right-0.5 bg-primary rounded-full p-0.5">
                        <Check className="size-2.5 text-primary-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(img.path, e)}
                      className="absolute top-0.5 left-0.5 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="size-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {value && (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img
              src={value}
              alt="Selected header"
              className="max-h-28 rounded-md border border-border object-contain"
            />
            <button
              type="button"
              onClick={() => {
                onChange('');
                setUrlInput('');
              }}
              className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 hover:bg-muted transition-colors"
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Or paste an image URL</Label>
        <Input
          placeholder="https://example.com/image.jpg"
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="bg-muted border-border text-foreground text-xs h-8"
        />
      </div>
    </div>
  );
}
