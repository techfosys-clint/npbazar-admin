'use client';

import { useRef, useState } from 'react';
import { FiUploadCloud, FiX, FiImage, FiFolder } from 'react-icons/fi';
import { toastError } from '@/lib/toast';
import MediaPicker from '@/components/MediaPicker';
import { uploadImages } from '@/lib/upload';

interface Props {
  /** Current image URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Maximum number of images (default 3). */
  max?: number;
  label?: string;
  /** Compact single-row style for small forms. */
  compact?: boolean;
  /** Reject files larger than this (KB), checked client-side before upload — e.g. for favicons. */
  maxSizeKB?: number;
  /** Reject images wider/taller than this (px), checked client-side before upload. */
  maxDimension?: number;
}

/** Resolves an error message if the file breaks maxSizeKB/maxDimension, else null. */
function validateFile(file: File, maxSizeKB?: number, maxDimension?: number): Promise<string | null> {
  if (maxSizeKB && file.size > maxSizeKB * 1024) {
    return Promise.resolve(`"${file.name}" is ${Math.round(file.size / 1024)}KB — max allowed is ${maxSizeKB}KB`);
  }
  if (!maxDimension) return Promise.resolve(null);

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > maxDimension || img.height > maxDimension) {
        resolve(`"${file.name}" is ${img.width}×${img.height}px — max allowed is ${maxDimension}×${maxDimension}px`);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function ImageUploader({ value, onChange, max = 3, label, compact, maxSizeKB, maxDimension }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const remaining = max - value.length;

  const handleFiles = async (files: FileList | File[]) => {
    if (remaining <= 0) {
      toastError(`Maximum ${max} image${max > 1 ? 's' : ''} allowed`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);

    if (maxSizeKB || maxDimension) {
      for (const file of selected) {
        const error = await validateFile(file, maxSizeKB, maxDimension);
        if (error) {
          toastError(error);
          return;
        }
      }
    }

    setUploading(true);
    try {
      const urls = await uploadImages(selected);
      onChange([...value, ...urls]);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // Only deselect here — the file stays in the media library.
  // Permanent deletion happens from the Media page.
  const removeImage = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  const thumbSize = compact ? 'h-16 w-16' : 'h-24 w-24';

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-zinc-700">{label}</p>}
      <div className="flex flex-wrap items-start gap-3">
        {value.map((url) => (
          <div key={url} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className={`${thumbSize} rounded-xl border border-zinc-200 object-cover`} />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow transition hover:bg-red-600"
            >
              <FiX size={12} />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            className={`flex ${thumbSize} flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-zinc-400 transition ${
              dragOver
                ? 'border-blue-500 bg-blue-50 text-blue-500'
                : 'border-zinc-300 hover:border-zinc-500 hover:text-zinc-600'
            } ${uploading ? 'opacity-60' : ''}`}
          >
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
            ) : (
              <>
                {compact ? <FiImage size={16} /> : <FiUploadCloud size={20} />}
                {!compact && <span className="text-[10px] font-medium">Upload</span>}
              </>
            )}
          </button>
        )}

        {/* Pick from media library */}
        {value.length < max && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            title="Choose from media library"
            className={`flex ${thumbSize} flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-accent/40 text-accent transition hover:border-accent hover:bg-accent/5`}
          >
            <FiFolder size={compact ? 16 : 20} />
            {!compact && <span className="text-[10px] font-medium">Library</span>}
          </button>
        )}
      </div>
      {!compact && (
        <p className="mt-1.5 text-xs text-zinc-400">
          {value.length}/{max} images · JPG, PNG, WEBP · max {maxSizeKB ? `${maxSizeKB}KB` : '5MB'} each
          {maxDimension ? ` · max ${maxDimension}×${maxDimension}px` : ''}
        </p>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        max={remaining > 0 ? remaining : 1}
        onSelect={(urls) => {
          const merged = [...value, ...urls.filter((u) => !value.includes(u))].slice(0, max);
          onChange(merged);
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple={max > 1}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
