'use client';

import { useRef, useState } from 'react';
import { Upload, X, Film } from 'lucide-react';
import { useWizardStore } from '@/store/wizard-store';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/webm'];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const StepUpload: React.FC = () => {
  const { files, setFiles, setField } = useWizardStore();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => ACCEPTED_TYPES.includes(f.type));
    const merged = [...files, ...valid].slice(0, MAX_FILES);
    setFiles(merged);
    if (merged.length > 0 && !useWizardStore.getState().projectName) {
      const firstName = merged[0].name.replace(/\.[^/.]+$/, '');
      setField('projectName', firstName);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className='space-y-4'>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 transition-colors',
          isDragging
            ? 'border-[#30f4d2]/60 bg-[#30f4d2]/5'
            : 'border-white/20 hover:border-[#30f4d2]/40 hover:bg-white/[0.02]'
        )}
      >
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-white/5'>
          <Upload className='h-6 w-6 text-[#30f4d2]' />
        </div>
        <div className='text-center'>
          <p className='text-sm font-medium text-[#f3fffc]'>
            Glissez vos vidéos ici ou{' '}
            <span className='text-[#30f4d2] underline underline-offset-2'>parcourez</span>
          </p>
          <p className='mt-1 text-xs text-[#8b9d99]'>
            Importez vos vidéos produit, rushs UGC ou vidéos d'inspiration
          </p>
          <p className='mt-1 text-xs text-[#8b9d99]'>
            MP4, MOV, MKV, AVI, WebM — max {MAX_FILES} fichiers
          </p>
        </div>
        <input
          ref={inputRef}
          type='file'
          accept='video/*'
          multiple
          className='hidden'
          onChange={handleInputChange}
        />
      </div>

      {files.length > 0 && (
        <ul className='space-y-2'>
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className='flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3'
            >
              <Film className='h-4 w-4 shrink-0 text-[#30f4d2]' />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm text-[#f3fffc]'>{file.name}</p>
                <p className='text-xs text-[#8b9d99]'>{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className='rounded p-1 text-[#8b9d99] transition-colors hover:text-[#f3fffc]'
                aria-label='Supprimer'
              >
                <X className='h-4 w-4' />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <p className='text-right text-xs text-[#8b9d99]'>
          {files.length}/{MAX_FILES} fichier{files.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
