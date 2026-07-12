/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Info,
  Layers,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, getExtensionStyle, formatTimeAgo } from '../utils';

// Reliable fast loading sample video CDN streams
const SAMPLE_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-milky-way-stars-in-the-space-4024-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-a-cliff-43152-large.mp4'
];

interface MediaViewerProps {
  file: FileItem;
  playlist: FileItem[];
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function MediaViewer({
  file,
  playlist,
  onClose,
  onToggleFavorite,
  onRename,
  onDelete
}: MediaViewerProps) {
  // Navigation index tracking
  const [currentFile, setCurrentFile] = useState<FileItem>(file);
  
  // Image properties
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  
  // Video properties
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // File Rename State within details
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState('');

  // Sync state if initial file props changes
  useEffect(() => {
    setCurrentFile(file);
    setZoomLevel(1);
    setIsSlideshowRunning(false);
    setIsVideoPlaying(false);
    setIsRenaming(false);
  }, [file]);

  // Slideshow process interval
  useEffect(() => {
    let interval: any;
    if (isSlideshowRunning && currentFile.type === 'image') {
      interval = setInterval(() => {
        handleNavigate('next');
      }, 3000); // 3 seconds interval for slides
    }
    return () => clearInterval(interval);
  }, [isSlideshowRunning, currentFile]);

  // Setup video statistics
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, currentFile]);

  // Handle previous / next navigation across current tab's active playlist files
  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = playlist.findIndex(f => f.id === currentFile.id);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Circular bounds check
    if (targetIndex >= playlist.length) {
      targetIndex = 0;
    } else if (targetIndex < 0) {
      targetIndex = playlist.length - 1;
    }

    setCurrentFile(playlist[targetIndex]);
    setZoomLevel(1);
    setIsVideoPlaying(false);
    setIsRenaming(false);
  };

  // Image zoom modifiers
  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (type === 'in') {
      setZoomLevel(prev => Math.min(prev + 0.25, 3));
    } else if (type === 'out') {
      setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    } else {
      setZoomLevel(1);
    }
  };

  // Video controller triggers
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play().catch(e => console.warn('Could not autoplay loop stream:', e));
        setIsVideoPlaying(true);
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const handleVideoScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoCurrentTime(time);
    }
  };

  const formatVideoTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editName.trim() !== currentFile.name) {
      onRename(currentFile.id, editName.trim());
      setCurrentFile({ ...currentFile, name: editName.trim() });
      setIsRenaming(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTrigger = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tệp "${currentFile.name}"?`)) {
      onDelete(currentFile.id);
      onClose();
    }
  };

  // Select sample loop stream based on file's Seed index or load user's real file
  const getVideoSourceUrl = () => {
    if (!currentFile.id.startsWith('virtual-')) {
      // User real file URL
      return currentFile.url;
    }
    // Determinist loop based on index to ensure gorgeous visual presentation
    const indexStr = currentFile.id.split('-').pop();
    const idx = indexStr ? parseInt(indexStr, 10) : 0;
    return SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length];
  };

  return (
    <div id="media-viewer-modal" className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col md:flex-row animate-fadeIn select-none">
      
      {/* Top action header for mobile layout */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-black/40 flex items-center justify-between px-4 z-20 md:hidden border-b border-white/5">
        <span className="font-sans font-bold text-xs text-neutral-300 truncate max-w-[200px]">
          {currentFile.name}
        </span>
        <button 
          id="btn-close-vw-mobile"
          onClick={onClose} 
          className="p-1 px-2 rounded-lg bg-white/10 text-white text-xs cursor-pointer hover:bg-white/20"
        >
          Đóng ✕
        </button>
      </div>

      {/* Main viewport block (Left Panel - Takes 75% wide) */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-4 h-full">
        
        {/* Absolute header control elements for Desktop layout */}
        <div className="absolute top-6 left-6 right-6 hidden md:flex items-center justify-between z-20">
          <div className="space-y-0.5">
            <span className="font-mono text-[9px] text-neutral-400 tracking-wider">UBox MEDIA PREVIEW</span>
            <h3 className="font-sans font-bold text-sm text-white truncate max-w-lg block">
              {currentFile.name}
            </h3>
          </div>

          <div className="flex items-center space-x-3 bg-neutral-900/60 p-1.5 rounded-xl border border-white/10">
            {currentFile.type === 'image' && (
              <>
                <button
                  id="btn-zoom-out"
                  onClick={() => handleZoom('out')}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="font-mono text-[10px] text-white px-1 font-semibold">{Math.round(zoomLevel * 100)}%</span>
                <button
                  id="btn-zoom-in"
                  onClick={() => handleZoom('in')}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  id="btn-zoom-reset"
                  onClick={() => handleZoom('reset')}
                  className="px-2.5 py-1 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg font-sans font-semibold cursor-pointer border-l border-white/10"
                >
                  Đặt lại
                </button>
                <button
                  id="btn-trigger-slideshow"
                  onClick={() => setIsSlideshowRunning(!isSlideshowRunning)}
                  className={`px-3 py-1 text-[10px] rounded-lg font-sans font-bold cursor-pointer transition-colors border-l border-white/10
                    ${isSlideshowRunning 
                      ? 'bg-amber-500 text-black hover:bg-amber-600' 
                      : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {isSlideshowRunning ? 'Dừng chiếu ⏸' : 'Trình chiếu 🎞'}
                </button>
              </>
            )}

            <button
              id="btn-close-viewer-desktop"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
              title="Đóng xem trực tiếp"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Previous and Next pagination buttons overlays */}
        {playlist.length > 1 && (
          <>
            <button
              id="btn-nav-prev"
              onClick={() => handleNavigate('prev')}
              className="absolute left-4 p-3 rounded-full bg-neutral-900/40 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-white/5 cursor-pointer z-20"
              title="Trước đó"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              id="btn-nav-next"
              onClick={() => handleNavigate('next')}
              className="absolute right-4 p-3 rounded-full bg-neutral-900/40 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-white/5 cursor-pointer z-20"
              title="Sau đó"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Content Viewer viewport frame */}
        <div className="w-full h-full flex items-center justify-center max-h-[82vh] overflow-hidden relative">
          
          {/* IMAGE PREVIEW FRAME */}
          {currentFile.type === 'image' && (
            <div 
              className="transition-transform duration-200 ease-out" 
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={currentFile.url}
                alt={currentFile.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-sm"
              />
            </div>
          )}

          {/* VIDEO PREVIEW FRAME & custom timeline player */}
          {currentFile.type === 'video' && (
            <div className="w-full max-w-3xl flex flex-col items-center bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <video
                ref={videoRef}
                src={getVideoSourceUrl()}
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onClick={handleTogglePlay}
                className="w-full max-h-[55vh] object-contain aspect-video"
                autoPlay
              />
              
              {/* Custom controller bar */}
              <div className="w-full p-4 bg-neutral-900 border-t border-white/5 space-y-3">
                {/* Timeline slider progress track */}
                <div className="flex items-center space-x-3.5">
                  <span className="font-mono text-[10px] text-neutral-400">{formatVideoTime(videoCurrentTime)}</span>
                  <input
                    id="video-scrubber"
                    type="range"
                    min="0"
                    max={videoDuration || 100}
                    value={videoCurrentTime}
                    onChange={handleVideoScrub}
                    className="flex-1 accent-white bg-neutral-700 h-1.5 rounded-full cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-neutral-400">{formatVideoTime(videoDuration)}</span>
                </div>

                {/* Lower control buttons (Play/pause, sound indicators, and volumes, screensize) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      id="btn-video-play-pause"
                      onClick={handleTogglePlay}
                      className="p-1 px-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      {isVideoPlaying ? <Pause size={17} /> : <Play size={17} />}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        id="btn-video-mute-toggle"
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-neutral-400 hover:text-white cursor-pointer"
                      >
                        {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                      <input
                        id="video-volume-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVolume(val);
                          setIsMuted(val === 0);
                        }}
                        className="w-16 md:w-20 accent-neutral-200 bg-neutral-700 h-1 rounded-full cursor-pointer"
                      />
                    </div>
                  </div>

                  <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">
                    Streams UBox MP4 Loop HTML5
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT FILE PREVIEW CARD */}
          {currentFile.type === 'file' && (
            <div className="p-8 md:p-11 max-w-md bg-neutral-900 border border-white/15 text-white rounded-3xl space-y-6 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
              
              <div className="w-20 h-20 rounded-2xl bg-neutral-850 border border-white/10 mx-auto flex items-center justify-center font-mono font-black text-xl text-amber-400 shadow-md">
                {currentFile.extension.toUpperCase()}
              </div>

              <div className="space-y-1">
                <h4 className="font-sans font-bold text-base line-clamp-2 pr-1">{currentFile.name}</h4>
                <p className="font-mono text-[10px] text-neutral-400">{getExtensionStyle(currentFile.extension).label}</p>
              </div>

              <div className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl text-left divide-y divide-white/5 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Dung lượng:</span>
                  <span className="font-mono font-semibold">{formatBytes(currentFile.size)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">MIME-type:</span>
                  <span className="font-mono text-[10px] text-neutral-300">{currentFile.mimeType}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-400">Trạng thái:</span>
                  <span className="text-amber-400 font-semibold">{currentFile.isVirtual ? 'Tập tin ảo' : 'Đã lưu trữ cục bộ'}</span>
                </div>
              </div>

              <button
                id="btn-doc-download-preview"
                onClick={handleDownload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-white text-black font-sans font-black text-xs hover:bg-neutral-100 transition-all cursor-pointer shadow-md"
              >
                <Download size={14} />
                <span>Tải xuống tệp tin</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Details Side Panel (Right Panel - Takes 25% wide) */}
      <div className="w-full md:w-80 h-auto md:h-full bg-neutral-900 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col justify-between text-white shrink-0 scroll-py-4">
        
        {/* Info detail card content */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400 border-b border-white/5 pb-3">
            <Info size={14} className="text-amber-400" />
            <span>THÔNG TIM CHI TIẾT TÊN TỆP</span>
          </div>

          <div className="space-y-4">
            
            {/* Inline rename component */}
            {isRenaming ? (
              <form onSubmit={handleSaveRename} className="space-y-2.5">
                <input
                  id="mv-rename-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-white/20 rounded-xl focus:outline-none focus:border-white font-sans text-xs text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    id="btn-mv-rename-save"
                    type="submit" 
                    className="flex-1 py-1.5 rounded-lg bg-white text-black font-sans text-[10px] font-bold cursor-pointer"
                  >
                    Lưu
                  </button>
                  <button 
                    id="btn-mv-rename-cancel"
                    type="button" 
                    onClick={() => setIsRenaming(false)} 
                    className="flex-1 py-1.5 rounded-lg bg-neutral-800 text-white font-sans text-[10px] cursor-pointer"
                  >
                    Bỏ
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-1">
                <span className="font-sans font-black text-sm block leading-snug tracking-tight text-white word-break">
                  {currentFile.name}
                </span>
                
                <button
                  id="btn-details-rename"
                  onClick={() => {
                    setEditName(currentFile.name);
                    setIsRenaming(true);
                  }}
                  className="flex items-center space-x-1 text-[10px] font-sans text-neutral-400 hover:text-white cursor-pointer"
                >
                  <Edit3 size={11} />
                  <span>Đổi tên tập tin này</span>
                </button>
              </div>
            )}

            {/* List parameters metadata details specs */}
            <div className="space-y-3.5 pt-4">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-neutral-400 font-sans">Định dạng mở rộng:</span>
                <span className="font-mono text-neutral-200 capitalize">.{currentFile.extension}</span>
              </div>
              
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-neutral-400 font-sans">Kích thước đĩa:</span>
                <span className="font-mono text-neutral-200">{formatBytes(currentFile.size)}</span>
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="text-neutral-400 font-sans">Ngày tải lên:</span>
                <span className="font-mono text-neutral-200">
                  {new Date(currentFile.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="text-neutral-400 font-sans">Thời gian cụ thể:</span>
                <span className="font-mono text-neutral-200 text-[10px]">
                  {new Date(currentFile.createdAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-xs">
                <span className="text-neutral-400 font-sans">Nơi lưu trữ:</span>
                <span className="text-amber-400 font-mono text-[10px] font-bold">
                  {currentFile.isVirtual ? 'Cluster-VN(Mock)' : 'IndexedDB(Local)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global operation card controls inside details */}
        <div className="space-y-3.5 border-t border-white/5 pt-6 mt-6 md:mt-0">
          
          <button
            id="btn-mv-download"
            onClick={handleDownload}
            className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 rounded-2xl bg-neutral-800 text-white font-sans font-bold text-xs hover:bg-neutral-750 transition-all border border-white/10 cursor-pointer"
          >
            <Download size={13} />
            <span>Tải tập tin về máy</span>
          </button>
          
          <button
            id="btn-mv-delete"
            onClick={handleDeleteTrigger}
            className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 rounded-2xl bg-red-950/40 text-red-400 font-sans font-bold text-xs hover:bg-red-900/30 border border-red-900/20 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Gửi vào Thùng rác</span>
          </button>

          <div className="rounded-xl bg-neutral-950/60 p-3 flex items-center space-x-2 border border-white/5 text-[10px] text-neutral-400">
            <HardDrive size={13} className="text-neutral-500" />
            <span>UBox tối ưu hóa dung lượng truyền tải</span>
          </div>

        </div>
      </div>
    </div>
  );
}
