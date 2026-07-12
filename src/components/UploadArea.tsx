/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FolderPlus, 
  Files, 
  CheckCircle, 
  Loader2,
  Trash2,
  Lock
} from 'lucide-react';
import { FileType, UploadProgress } from '../types';
import { formatBytes } from '../utils';

interface UploadAreaProps {
  onFileUploaded: (fileData: { 
    name: string; 
    type: FileType; 
    mimeType: string; 
    size: number; 
    dataUrl: string; 
  }) => void;
  themeColor: string;
}

export default function UploadArea({ onFileUploaded, themeColor }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadList, setUploadList] = useState<UploadProgress[]>([]);

  // Determine FileItem category based on MIME Type
  const determineCategory = (mimeType: string, filename: string): FileType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    
    // Fallback on extension matching
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(ext || '')) return 'image';
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) return 'video';
    
    return 'file';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerFolderInput = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (filesList: FileList) => {
    const files = Array.from(filesList);
    
    files.forEach(file => {
      // Create a unique ID for tracking progress
      const trackingId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const newUpload: UploadProgress = {
        id: trackingId,
        name: file.name,
        size: file.size,
        progress: 0,
        speed: '0 KB/s',
        timeRemaining: 'Đang chuẩn bị...',
        status: 'uploading'
      };

      setUploadList(prev => [newUpload, ...prev]);

      // Read File with FileReader to store as raw data URL
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const dataUrlOrBase64 = event.target?.result as string || '';
        simulateUpload(file, trackingId, dataUrlOrBase64);
      };

      reader.onerror = () => {
        setUploadList(prev => 
          prev.map(u => u.id === trackingId ? { ...u, status: 'failed', timeRemaining: 'Lỗi tải tệp' } : u)
        );
      };

      reader.readAsDataURL(file);
    });
  };

  /**
   * Safe and realistic progress bar simulation matching user specific UX rules:
   * Displays % progress, upload speed, time remaining, "Hoàn thành ✓",
   * and automatically deletes/clears itself from progress list after exactly 1 second.
   */
  const simulateUpload = (file: File, id: string, base64Url: string) => {
    const fileCategory = determineCategory(file.type, file.name);
    let currentProgress = 0;
    
    // Simulated upload speed (randomized range 8.5 MB/s to 42.4 MB/s for Vietnamese ultra-fast grids)
    const seedSpeed = (Math.random() * 32 + 8.5).toFixed(1);
    const speedString = `${seedSpeed} MB/s`;

    const timer = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 25) + 10;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
        
        // Mark as completed
        setUploadList(prev => 
          prev.map(u => u.id === id ? { 
            ...u, 
            progress: 100, 
            speed: speedString,
            timeRemaining: 'Hoàn thành ✓', 
            status: 'completed' 
          } : u)
        );

        // Inject into main IndexedDB local storage
        onFileUploaded({
          name: file.name,
          type: fileCategory,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: base64Url
        });

        // Automatically close/purge notifications after exactly 1 second (1000ms) as requested
        setTimeout(() => {
          setUploadList(prev => prev.filter(u => u.id !== id));
        }, 1000);

      } else {
        // Calculate remaining seconds
        const remainingBytes = file.size * (1 - currentProgress / 100);
        const speedBytesPerSec = parseFloat(seedSpeed) * 1024 * 1024;
        const totalSecRemaining = Math.max(1, Math.round(remainingBytes / speedBytesPerSec));
        const timeRemainingStr = `${totalSecRemaining} giây`;

        setUploadList(prev => 
          prev.map(u => u.id === id ? { 
            ...u, 
            progress: currentProgress, 
            speed: speedString,
            timeRemaining: timeRemainingStr
          } : u)
        );
      }
    }, 180);
  };

  return (
    <div className="space-y-4">
      {/* Hidden native input files handlers */}
      <input 
        id="file-picker"
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
        multiple 
      />
      
      <input 
        id="folder-picker"
        type="file" 
        ref={folderInputRef}
        onChange={handleFileChange}
        className="hidden" 
        webkitdirectory="true" 
        directory="true" 
        multiple
      />

      {/* Main Drag-Drop Arena Box */}
      <div
        id="drop-target-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full p-8 md:p-11 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-300 relative overflow-hidden group
          ${isDragging 
            ? 'bg-neutral-50 border-neutral-950 scale-[1.01]' 
            : 'bg-white border-neutral-200 hover:border-neutral-900'
          }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 z-10 overflow-hidden bg-neutral-50">
          {uploadList.length > 0 && (
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }}></div>
          )}
        </div>

        {/* Upload Animation Box Icon */}
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 mb-4 scale-100 group-hover:scale-105"
          style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
        >
          <Upload size={24} className="animate-bounce" />
        </div>

        {/* Informative text instructions */}
        <div className="max-w-md space-y-2">
          <p className="font-sans font-bold text-sm md:text-base text-neutral-800">
            Kéo thả tệp vào đây hoặc nhấn để chọn
          </p>
          <p className="font-sans text-[11px] md:text-xs text-neutral-400">
            Hỗ trợ kéo thả đồng thời nhiều tệp hoặc thư mục ảnh (JPG, PNG), video (MP4) và các tệp văn bản khác (PDF, ZIP, Word...)
          </p>
        </div>

        {/* Quick actions triggers buttons, stop propagation to not trigger general file dialog twice */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 relative z-10">
          <button
            id="btn-upload-files"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-sans font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-[1.01] transition-transform shadow-xs cursor-pointer"
          >
            <Files size={13} />
            <span>Tải tệp tin lẻ</span>
          </button>
          
          <button
            id="btn-upload-folder"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerFolderInput();
            }}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-sans font-semibold rounded-xl bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hover:text-black border border-neutral-200 hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <FolderPlus size={13} />
            <span>Tải thư mục lên</span>
          </button>
        </div>
      </div>

      {/* Render Uploading Progress elements dynamically */}
      {uploadList.length > 0 && (
        <div className="p-4 rounded-xl border border-neutral-200/60 bg-neutral-50/70 shadow-sm space-y-3 animate-slideUp">
          <div className="flex justify-between items-center text-xs">
            <span className="font-sans font-bold text-neutral-700 flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin text-neutral-500" />
              Đang tải lên ({uploadList.length} tệp hàng loạt)...
            </span>
            <span className="font-mono text-[10px] text-neutral-400">UBox Cloud Agent</span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-3.5 pr-1">
            {uploadList.map((upload) => {
              const isDone = upload.status === 'completed';
              const isFailed = upload.status === 'failed';
              
              return (
                <div key={upload.id} className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-neutral-100 shadow-3xs">
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-sans font-medium text-neutral-800 truncate max-w-xs md:max-w-md block">
                      {upload.name}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                      {formatBytes(upload.size)}
                    </span>
                  </div>

                  {/* HTML Styled Visual Progress Bar as in requested specification (Example: [██████████] 100% / Hoàn thành) */}
                  <div className="flex items-center space-x-3 mt-1.5">
                    <div className="flex-1 bg-neutral-100 h-2.5 rounded-full overflow-hidden flex relative">
                      <div 
                        className={`h-full transition-all duration-150 rounded-full ${isDone ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-neutral-800'}`} 
                        style={{ width: `${upload.progress}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-neutral-700 shrink-0 select-none">
                      {upload.progress}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono select-none text-neutral-500">
                    <span>{upload.speed}</span>
                    <div className="flex items-center space-x-1 font-sans font-medium">
                      {isDone ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          Hoàn thành ✓
                        </span>
                      ) : isFailed ? (
                        <span className="text-red-500">Lỗi !</span>
                      ) : (
                        <span>Thời gian còn lại: {upload.timeRemaining}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
