/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  initStorageEngine, 
  queryFiles, 
  uploadRealFile, 
  fileActionDelete, 
  fileActionRestore, 
  fileActionToggleFavorite, 
  fileActionRename, 
  emptyTrash,
  getCategoryTotalCount,
  getStorageStats
} from './db';
import { FileItem, FileType, ActiveTab, ViewMode, AppTheme, StorageStats as StorageStatsType } from './types';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import UploadArea from './components/UploadArea';
import AssetGrid from './components/AssetGrid';
import MediaViewer from './components/MediaViewer';
import AIAssistant from './components/AIAssistant';
import { Sparkles, HardDrive, ShieldCheck } from 'lucide-react';

const ITEMS_PER_PAGE = 30;

export default function App() {
  const [isReady, setIsReady] = useState(false);
  
  // Navigation & Preferences state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [theme, setTheme] = useState<AppTheme>({
    primaryColor: '#000000',
    themeMode: 'light'
  });

  // Query specifications state
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Lists tracking
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // Clear selected elements when filters shift
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, searchQuery, sortBy, sortOrder]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Overlay preview
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Stats Counters
  const [storageStats, setStorageStats] = useState<StorageStatsType>({
    totalDocs: 0,
    totalImages: 0,
    totalVideos: 0,
    totalFiles: 0,
    usedBytes: 0,
    capacityBytes: 10 * 1024 * 1024 * 1024 * 1024
  });

  const [counters, setCounters] = useState({
    images: 0,
    videos: 0,
    files: 0,
    favorites: 0,
    trash: 0
  });

  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 1. Initialize local IndexedDB engine
  useEffect(() => {
    const startAppEngine = async () => {
      try {
        await initStorageEngine();
        setIsReady(true);
        triggerReload();
      } catch (err) {
        console.error('Failed to boot local IndexedDB store:', err);
        // Fallback to memory
        setIsReady(true);
      }
    };
    startAppEngine();
  }, []);

  // 2. Refresh lists and storage telemetry state
  const triggerReload = () => {
    if (!isReady) return;

    // Refresh dynamic statistics & counters
    const currentStats = getStorageStats();
    setStorageStats(currentStats);

    setCounters({
      images: getCategoryTotalCount('image', searchQuery),
      videos: getCategoryTotalCount('video', searchQuery),
      files: getCategoryTotalCount('file', searchQuery),
      favorites: getCategoryTotalCount('all', searchQuery, false), // We calculate active favs below
      trash: getCategoryTotalCount('all', searchQuery, true)
    });

    // Reset offsets back to 0
    setOffset(0);
    setReloadTrigger(prev => prev + 1);
  };

  // Trigger reloading whenever Tab changes, searchable terms enter, or sorting fluctuates
  useEffect(() => {
    triggerReload();
  }, [activeTab, searchQuery, sortBy, sortOrder, isReady]);

  // Favorite counters are computed precisely based on queried favorite category
  useEffect(() => {
    if (!isReady) return;
    const favoriteResult = queryFiles('all', '', 'favorite', 1000000, 0);
    setCounters(prev => ({
      ...prev,
      favorites: favoriteResult.totalCount
    }));
  }, [files, activeTab, isReady]);

  // 3. Main Data Query Effect
  useEffect(() => {
    if (!isReady) return;

    const fileTypeFilter: FileType | 'all' = 
      activeTab === 'image' ? 'image' 
      : activeTab === 'video' ? 'video' 
      : activeTab === 'file' ? 'file' 
      : 'all';

    const statusFilter: 'active' | 'favorite' | 'deleted' =
      activeTab === 'trash' ? 'deleted'
      : activeTab === 'favorite' ? 'favorite'
      : 'active';

    const result = queryFiles(
      fileTypeFilter,
      searchQuery,
      statusFilter,
      ITEMS_PER_PAGE,
      offset,
      sortBy,
      sortOrder
    );

    if (offset === 0) {
      setFiles(result.items);
    } else {
      setFiles(prev => {
        // Prevent duplicate IDs from rendering
        const map = new Map<string, FileItem>();
        prev.forEach(f => map.set(f.id, f));
        result.items.forEach(f => map.set(f.id, f));
        return Array.from(map.values());
      });
    }

    setTotalFilesCount(result.totalCount);
    // Has more exists if elements returned matches limit
    setHasMore(offset + ITEMS_PER_PAGE < result.totalCount);

  }, [activeTab, searchQuery, sortBy, sortOrder, offset, isReady, reloadTrigger]);

  // 4. File Operation Actions Handlers
  const handleFileUploaded = async (upload: { 
    name: string; 
    type: FileType; 
    mimeType: string; 
    size: number; 
    dataUrl: string; 
  }) => {
    // Save to database
    await uploadRealFile(
      upload.name,
      upload.type,
      upload.mimeType,
      upload.size,
      upload.dataUrl
    );
    
    // Switch view to correspond to newly loaded categories for instant verification
    if (activeTab === 'dashboard') {
      // Stay on dashboard, reload counts
    } else if (activeTab !== upload.type) {
      setActiveTab(upload.type);
    }
    
    triggerReload();
  };

  const handleToggleFavorite = async (id: string) => {
    const isNowFavorite = await fileActionToggleFavorite(id);
    
    // Modify files list reactively
    setFiles(prev => 
      prev.map(f => f.id === id ? { ...f, isFavorite: isNowFavorite } : f)
    );

    // If we are currently sorting the favorite tab, filter out removed favorite
    if (activeTab === 'favorite' && !isNowFavorite) {
      setFiles(prev => prev.filter(f => f.id !== id));
      setTotalFilesCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleRename = async (id: string, name: string) => {
    await fileActionRename(id, name);
    // Modify inline state to prevent full flash update
    setFiles(prev => 
      prev.map(f => f.id === id ? { ...f, name } : f)
    );
    if (previewFile && previewFile.id === id) {
      setPreviewFile({ ...previewFile, name });
    }
  };

  const handleDelete = async (id: string) => {
    await fileActionDelete(id);
    
    // Modify list in real time
    setFiles(prev => prev.filter(f => f.id !== id));
    setTotalFilesCount(prev => Math.max(0, prev - 1));
    setSelectedIds(prev => prev.filter(item => item !== id));
    
    triggerReload();
  };

  const handleRestore = async (id: string) => {
    await fileActionRestore(id);
    
    // Remove from active Trash list
    setFiles(prev => prev.filter(f => f.id !== id));
    setTotalFilesCount(prev => Math.max(0, prev - 1));
    setSelectedIds(prev => prev.filter(item => item !== id));
    
    triggerReload();
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      await fileActionDelete(id);
    }
    setFiles(prev => prev.filter(f => !ids.includes(f.id)));
    setTotalFilesCount(prev => Math.max(0, prev - ids.length));
    setSelectedIds([]);
    triggerReload();
  };

  const handleBulkRestore = async (ids: string[]) => {
    for (const id of ids) {
      await fileActionRestore(id);
    }
    setFiles(prev => prev.filter(f => !ids.includes(f.id)));
    setTotalFilesCount(prev => Math.max(0, prev - ids.length));
    setSelectedIds([]);
    triggerReload();
  };

  const handleBulkToggleFavorite = async (ids: string[]) => {
    const hasAnyNonFavorite = files.some(f => ids.includes(f.id) && !f.isFavorite);
    for (const id of ids) {
      const file = files.find(f => f.id === id);
      if (file) {
        if (hasAnyNonFavorite) {
          if (!file.isFavorite) {
            await fileActionToggleFavorite(id);
          }
        } else {
          if (file.isFavorite) {
            await fileActionToggleFavorite(id);
          }
        }
      }
    }
    
    // Update active list state
    setFiles(prev =>
      prev.map(f => {
        if (ids.includes(f.id)) {
          return { ...f, isFavorite: hasAnyNonFavorite };
        }
        return f;
      })
    );

    // If on favorite tab, remove those made unfavorite
    if (activeTab === 'favorite' && !hasAnyNonFavorite) {
      setFiles(prev => prev.filter(f => !ids.includes(f.id)));
      setTotalFilesCount(prev => Math.max(0, prev - ids.length));
    }
    setSelectedIds([]);
    triggerReload();
  };

  const handleBulkRename = async (ids: string[], baseNewName: string) => {
    let idx = 1;
    for (const id of ids) {
      const file = files.find(f => f.id === id);
      if (file) {
        const dotIndex = file.name.lastIndexOf('.');
        const ext = dotIndex !== -1 ? file.name.substring(dotIndex) : '';
        const targetName = ids.length > 1 ? `${baseNewName}_(${idx})${ext}` : `${baseNewName}${ext}`;
        await fileActionRename(id, targetName);
        idx++;
      }
    }
    triggerReload();
    setSelectedIds([]);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setFiles([]);
    setTotalFilesCount(0);
    setSelectedIds([]);
    triggerReload();
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + ITEMS_PER_PAGE);
  };

  const handleResetDatabase = () => {
    triggerReload();
  };

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white space-y-3 flex-col select-none">
        <div className="w-9 h-9 rounded-full border-3 border-neutral-300 border-t-black animate-spin"></div>
        <p className="font-sans font-bold text-xs text-neutral-500 tracking-wider">ĐANG KHỞI CHẠY HỆ THỐNG UBOX CLOUD...</p>
      </div>
    );
  }

  // Theme support classes compilation
  const isDark = theme.themeMode === 'dark';
  const mainStyleWrapper = isDark 
    ? 'bg-neutral-950 text-neutral-100 min-h-screen' 
    : 'bg-neutral-50 text-neutral-900 min-h-screen';

  return (
    <div className={mainStyleWrapper} style={{ '--primary-accent': theme.primaryColor } as React.CSSProperties}>
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        setTheme={setTheme}
        onResetDatabase={handleResetDatabase}
        counts={counters}
      />

      {/* Main Container viewport */}
      <div className="md:ml-56 px-3 md:px-6 py-4 pt-16 md:pt-4 space-y-4 max-w-7xl mx-auto transition-colors duration-300">
        
        {/* Render Dashboard Statistics exclusively under primary or category tabs */}
        {activeTab === 'dashboard' ? (
          <>
            <DashboardStats stats={storageStats} themeColor={theme.primaryColor} />
            
            {/* Direct Instant Mass Upload zone inside Dashboard */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <HardDrive size={16} className="text-neutral-500" />
                <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider text-neutral-500">
                  Khu vực nạp tệp mượt mà
                </h3>
              </div>
              <UploadArea onFileUploaded={handleFileUploaded} themeColor={theme.primaryColor} />
            </div>

            {/* Showcase recent uploads list directly below stats */}
            <div className="pt-1">
              <AssetGrid 
                activeTab={activeTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                files={files}
                totalFilesCount={totalFilesCount}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onPreview={(file) => setPreviewFile(file)}
                onToggleFavorite={handleToggleFavorite}
                onRename={handleRename}
                onDelete={handleDelete}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                onBulkDelete={handleBulkDelete}
                onBulkRestore={handleBulkRestore}
                onBulkToggleFavorite={handleBulkToggleFavorite}
                onBulkRename={handleBulkRename}
              />
            </div>
          </>
        ) : (
          /* Sub views elements lists (Photos, Movies, Archives, Trash, Favs, etc.) */
          <div className="space-y-4">
            
            {/* Small dynamic contextual upload field (so users can upload directly inside Specific Sections without heading back!) */}
            {activeTab !== 'trash' && activeTab !== 'favorite' && (
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans font-bold text-neutral-600">tải tệp trực tiếp vào mục {activeTab === 'image' ? 'ảnh' : activeTab === 'video' ? 'video' : 'tệp tin'}</span>
                  <span className="font-mono text-[9px] text-neutral-400">Tối ưu hóa nén tự động</span>
                </div>
                <UploadArea onFileUploaded={handleFileUploaded} themeColor={theme.primaryColor} />
              </div>
            )}

            <AssetGrid 
              activeTab={activeTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              files={files}
              totalFilesCount={totalFilesCount}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onPreview={(file) => setPreviewFile(file)}
              onToggleFavorite={handleToggleFavorite}
              onRename={handleRename}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              onEmptyTrash={handleEmptyTrash}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              onBulkToggleFavorite={handleBulkToggleFavorite}
              onBulkRename={handleBulkRename}
            />
          </div>
        )}
      </div>

      {/* Dynamic Overlay MediaViewer Modal display */}
      {previewFile && (
        <MediaViewer 
          file={previewFile}
          playlist={files}
          onClose={() => setPreviewFile(null)}
          onToggleFavorite={handleToggleFavorite}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}

      {/* Floating Interactive Gemini AI Guide Assistant */}
      <AIAssistant 
        themeMode={theme.themeMode} 
        primaryColor={theme.primaryColor} 
        activeTab={activeTab} 
      />
    </div>
  );
}
