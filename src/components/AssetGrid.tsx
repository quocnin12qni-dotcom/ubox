/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Heart, 
  Trash2, 
  Edit3, 
  Download, 
  ArrowUpDown, 
  ChevronDown,
  Play,
  RotateCcw,
  RefreshCw,
  FolderOpen,
  Loader2,
  CheckCircle,
  XSquare
} from 'lucide-react';
import { FileItem, FileType, ViewMode, ActiveTab } from '../types';
import { formatBytes, getExtensionStyle, formatTimeAgo } from '../utils';

interface AssetGridProps {
  activeTab: ActiveTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  files: FileItem[];
  totalFilesCount: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onPreview: (file: FileItem) => void;
  onToggleFavorite: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onEmptyTrash?: () => void;
  sortBy: 'name' | 'size' | 'date';
  setSortBy: (field: 'name' | 'size' | 'date') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkToggleFavorite: (ids: string[]) => void;
  onBulkRename: (ids: string[], baseName: string) => void;
}

export default function AssetGrid({
  activeTab,
  searchQuery,
  setSearchQuery,
  files,
  totalFilesCount,
  viewMode,
  setViewMode,
  onPreview,
  onToggleFavorite,
  onRename,
  onDelete,
  onRestore,
  onLoadMore,
  hasMore,
  onEmptyTrash,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  selectedIds,
  onSelectedIdsChange,
  onBulkDelete,
  onBulkRestore,
  onBulkToggleFavorite,
  onBulkRename
}: AssetGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);

  const handleStartRename = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setEditingId(file.id);
    setTempName(file.name);
  };

  const handleSaveRename = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRename(id, tempName.trim());
      setEditingId(null);
    }
  };

  const handleDownload = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadMoreTrigger = () => {
    setIsLoadingChunk(true);
    setTimeout(() => {
      onLoadMore();
      setIsLoadingChunk(false);
    }, 450);
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  const handleCardClick = (e: React.MouseEvent, file: FileItem) => {
    if (selectedIds.length > 0) {
      e.stopPropagation();
      toggleSelection(file.id);
    } else {
      onPreview(file);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'image': return '📷 Kho lưu trữ Ảnh';
      case 'video': return '🎥 Thư viện Video';
      case 'file': return '📁 Tập tin & Tài liệu';
      case 'favorite': return '💖 Danh sách Yêu thích';
      case 'trash': return '🗑️ Thùng rác tạm thời';
      default: return 'Tất cả tệp gần đây';
    }
  };

  const isAllOnPageSelected = files.length > 0 && files.every(f => selectedIds.includes(f.id));

  const handleSelectAllToggle = () => {
    if (isAllOnPageSelected) {
      // Unselect only those on current page
      const pageIds = files.map(f => f.id);
      onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
    } else {
      // Merge current page IDs with selected IDs, avoiding duplicates
      const pageIds = files.map(f => f.id);
      const merged = Array.from(new Set([...selectedIds, ...pageIds]));
      onSelectedIdsChange(merged);
    }
  };

  return (
    <div className="space-y-3.5 select-none relative pb-16">
      
      {/* Top Search bar wrapper & sorting options */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-white p-3 rounded-xl border border-neutral-100 shadow-3xs">
        
        {/* Search input bar */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Tìm theo tên, đuôi (pdf, png), năm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-neutral-250 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 font-sans text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 hover:text-black bg-neutral-105 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>

        {/* View and Sort Configuration Controls */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {/* Selecting count summary & Toggle Select All button */}
          {files.length > 0 && (
            <button
              onClick={handleSelectAllToggle}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:border-black hover:bg-neutral-50 cursor-pointer transition-all text-[11px] font-medium"
            >
              <input
                type="checkbox"
                checked={isAllOnPageSelected}
                onChange={() => {}} // toggling handled by button click
                className="pointer-events-none accent-black h-3 w-3 rounded mr-1"
              />
              <span>{isAllOnPageSelected ? 'Bỏ chọn' : 'Chọn trang'}</span>
            </button>
          )}

          {/* Sorting Field */}
          <div className="flex items-center border border-neutral-200 rounded-lg px-2 py-1 bg-white text-[11px] text-neutral-600 gap-1 shrink-0">
            <ArrowUpDown size={11} className="text-neutral-400" />
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="focus:outline-none bg-transparent cursor-pointer font-sans"
            >
              <option value="date">Ngày tải</option>
              <option value="name">Tên tệp</option>
              <option value="size">Dung lượng</option>
            </select>
            <button
              id="btn-sort-order"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ml-1 text-neutral-800 hover:text-black font-semibold cursor-pointer shrink-0"
              title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          {/* Grid/List switch toggler */}
          <div className="flex border border-neutral-200 rounded-lg p-0.5 bg-neutral-50/50 shrink-0">
            <button
              id="btn-grid-mode"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-3xs' : 'text-neutral-400 hover:text-neutral-700'}`}
              title="Xem dạng Lưới"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              id="btn-list-mode"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-md cursor-pointer transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-3xs' : 'text-neutral-400 hover:text-neutral-700'}`}
              title="Xem dạng Danh sách"
            >
              <ListIcon size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Categories header action row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-baseline space-x-2">
          <h2 className="font-sans font-extrabold text-sm md:text-base text-neutral-900">
            {getTabTitle()}
          </h2>
          <span className="font-mono text-[10px] text-neutral-400">
            ({totalFilesCount === 150000 ? 'Hơn 150.000+' : totalFilesCount.toLocaleString('vi-VN')} tệp)
          </span>
        </div>

        {/* Action button if context is Trash */}
        {activeTab === 'trash' && files.length > 0 && (
          <button
            id="btn-empty-trash"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn dọn sạch thùng rác vĩnh viễn? Hành động này không thể khôi phục.')) {
                onEmptyTrash?.();
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 text-[10px] text-red-650 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg cursor-pointer transition-all italic font-medium"
          >
            <Trash2 size={11} />
            <span>Dọn sạch thùng rác</span>
          </button>
        )}
      </div>

      {/* Main listings viewport area */}
      {files.length === 0 ? (
        /* Unmatched state feedback illustration */
        <div className="w-full text-center py-16 bg-white border border-neutral-100 rounded-xl shadow-3xs flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <FolderOpen size={20} />
          </div>
          <div className="space-y-0.5">
            <p className="font-sans font-bold text-xs text-neutral-700">Không tìm thấy tập tin nào</p>
            <p className="font-sans text-[11px] text-neutral-400 max-w-xs mx-auto">
              {searchQuery ? 'Không có tập tin nào khớp với chuỗi tìm kiếm hoặc bộ lọc định dạng hiện tại.' : 'Hãy kéo thả tệp tin hoặc chọn tải tệp lên hoặc chuyển sang mục khác.'}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1.5 text-[10px] font-sans font-bold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Compact Aspect proportions adaptive Cards (Smaller Grid) */
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
          {files.map((file) => {
            const extStyle = getExtensionStyle(file.extension);
            const isSelected = selectedIds.includes(file.id);
            
            return (
              <div
                id={`grid-item-${file.id}`}
                key={file.id}
                onClick={(e) => handleCardClick(e, file)}
                className={`group relative bg-white border rounded-xl overflow-hidden shadow-3xs transition-all duration-300 cursor-pointer flex flex-col justify-between select-none
                  ${isSelected 
                    ? 'border-neutral-900 ring-2 ring-neutral-900/15 scale-[0.97]' 
                    : 'border-neutral-150 hover:shadow-xs hover:border-neutral-400'
                  }`}
              >
                
                {/* Media frame layer */}
                <div className="w-full aspect-square bg-neutral-50 relative overflow-hidden flex items-center justify-center">
                  
                  {/* Absolute Checkbox Trigger Box */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(file.id);
                    }}
                    className={`absolute top-1.5 left-1.5 z-20 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer
                      ${isSelected 
                        ? 'bg-black text-white' 
                        : 'bg-white/80 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 border border-neutral-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="absolute opacity-0 h-full w-full cursor-pointer"
                    />
                    {isSelected && <span className="text-[10px] font-black">✓</span>}
                  </div>

                  {/* Category Image */}
                  {file.type === 'image' && (
                    <img
                      src={file.url}
                      alt={file.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  )}

                  {/* Category Video */}
                  {file.type === 'video' && (
                    <div className="w-full h-full relative">
                      <img
                        src={file.url}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center transition-colors group-hover:bg-black/30">
                        <div className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center shadow-md scale-95 group-hover:scale-100 transition-transform">
                          <Play size={11} className="fill-current ml-0.5" />
                        </div>
                      </div>
                      {file.duration && (
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 font-mono text-[8px] bg-black/75 text-white font-bold rounded-xs select-none">
                          {file.duration}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Category Other General Files */}
                  {file.type === 'file' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-mono font-black text-[10px] shadow-3xs translate-y-1 ${extStyle.bgColor} border-neutral-200/50`}>
                        {extStyle.iconText}
                      </div>
                      <span className="text-[8px] font-mono font-bold text-neutral-400 absolute bottom-2 select-none tracking-widest leading-none">
                        TÀI LIỆU
                      </span>
                    </div>
                  )}

                  {/* Quick direct hover action keys (Rename, Favorite, Trash) */}
                  <div className="absolute top-1.5 right-1.5 flex space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                    
                    {activeTab !== 'trash' ? (
                      <>
                        <button
                          id={`fav-btn-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(file.id);
                          }}
                          className={`p-1 rounded bg-white border border-neutral-200 shadow-3xs transition-colors cursor-pointer block
                            ${file.isFavorite 
                              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                              : 'text-neutral-500 hover:text-rose-550 hover:bg-neutral-50'
                            }`}
                          title="Thêm yêu thích"
                        >
                          <Heart size={11} className={file.isFavorite ? 'fill-current' : ''} />
                        </button>
                        
                        <button
                          id={`rename-btn-${file.id}`}
                          onClick={(e) => handleStartRename(e, file)}
                          className="p-1 rounded border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:bg-neutral-50 shadow-3xs cursor-pointer block"
                          title="Đổi tên"
                        >
                          <Edit3 size={11} />
                        </button>
                        
                        <button
                          id={`del-btn-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                          }}
                          className="p-1 rounded border border-neutral-200 bg-white text-neutral-500 hover:text-red-650 hover:bg-red-50 shadow-3xs cursor-pointer block"
                          title="Xóa tạm thời"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          id={`restore-btn-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestore?.(file.id);
                          }}
                          className="p-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-3xs cursor-pointer block"
                          title="Khôi phục"
                        >
                          <RotateCcw size={11} />
                        </button>
                        
                        <button
                          id={`purge-btn-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tệp này? Thao tác này không thể hoàn tác.')) {
                              onDelete(file.id);
                            }
                          }}
                          className="p-1 rounded border border-red-200 bg-red-50 text-red-650 hover:bg-red-105 shadow-3xs cursor-pointer block"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* File info details bottom bar (Denser sizing) */}
                <div className="p-2 border-t border-neutral-100/70">
                  {editingId === file.id ? (
                    <form 
                      id={`rename-form-${file.id}`}
                      onSubmit={(e) => handleSaveRename(e, file.id)} 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1"
                    >
                      <input
                        id={`rename-input-${file.id}`}
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        autoFocus
                        onBlur={(e) => handleSaveRename(e as any, file.id)}
                        className="flex-1 px-1.5 py-0.5 border border-black focus:outline-none focus:ring-1 focus:ring-black rounded text-[10px]"
                      />
                    </form>
                  ) : (
                    <div className="space-y-0.2">
                      <span className="font-sans font-bold text-[11px] text-neutral-800 block truncate group-hover:text-black leading-tight">
                        {file.name}
                      </span>
                      <div className="flex items-center justify-between font-mono text-[8.5px] text-neutral-400">
                        <span>{formatBytes(file.size)}</span>
                        <span>{formatTimeAgo(file.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        
        /* Smaller Dense list mode viewport */
        <div className="w-full bg-white border border-neutral-150 rounded-xl overflow-hidden shadow-3xs overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-100 text-[10px] font-mono text-neutral-400 bg-neutral-50/50 uppercase select-none">
                <th className="px-2 py-2 text-center w-8">
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleSelectAllToggle}
                    className="h-3 w-3 rounded border-neutral-300 text-black focus:ring-0 accent-black cursor-pointer align-middle"
                  />
                </th>
                <th className="px-3 py-2 font-semibold text-[10px]">Tên tệp</th>
                <th className="px-3 py-2 font-semibold text-[10px]">Loại</th>
                <th className="px-3 py-2 font-semibold text-[10px]">Dung lượng</th>
                <th className="px-3 py-2 font-semibold text-[10px]">Ngày tải lên</th>
                <th className="px-3 py-2 font-semibold text-right text-[10px] w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {files.map((file) => {
                const extStyle = getExtensionStyle(file.extension);
                const isSelected = selectedIds.includes(file.id);
                
                return (
                  <tr
                    id={`list-item-${file.id}`}
                    key={file.id}
                    onClick={(e) => handleCardClick(e, file)}
                    className={`hover:bg-neutral-50/75 cursor-pointer text-[11.5px] select-none group transition-colors
                      ${isSelected ? 'bg-neutral-50' : ''}`}
                  >
                    {/* Inline Checkbox Column */}
                    <td className="px-2 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(file.id)}
                        className="h-3 w-3 rounded border-neutral-300 text-black focus:ring-0 accent-black cursor-pointer align-middle"
                      />
                    </td>

                    {/* Tên tệp & Small Icon representation */}
                    <td className="px-3 py-1.5 max-w-xs md:max-w-md">
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center font-mono font-bold text-[8px] shrink-0 ${extStyle.bgColor}`}>
                          {file.type === 'image' ? 'IMG' : file.type === 'video' ? 'VID' : extStyle.iconText}
                        </div>
                        {editingId === file.id ? (
                          <form 
                            id={`rename-form-list-${file.id}`}
                            onSubmit={(e) => handleSaveRename(e, file.id)} 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex-1"
                          >
                            <input
                              id={`rename-input-list-${file.id}`}
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              autoFocus
                              onBlur={(e) => handleSaveRename(e as any, file.id)}
                              className="px-1.5 py-0.5 border border-black focus:outline-none focus:ring-1 focus:ring-black rounded text-[11px] w-full"
                            />
                          </form>
                        ) : (
                          <span className={`font-sans font-semibold truncate ${isSelected ? 'text-black font-bold' : 'text-neutral-700 group-hover:text-black'}`}>
                            {file.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Loại tệp */}
                    <td className="px-3 py-1.5 whitespace-nowrap text-neutral-500 font-sans text-[11px]">
                      {file.type === 'image' ? 'Hình ảnh' : file.type === 'video' ? 'Video' : extStyle.label}
                    </td>

                    {/* Dung lượng */}
                    <td className="px-3 py-1.5 whitespace-nowrap text-neutral-650 font-mono text-[10.5px]">
                      {formatBytes(file.size)}
                    </td>

                    {/* Ngày tải lên */}
                    <td className="px-3 py-1.5 whitespace-nowrap text-neutral-500 font-mono text-[10.5px]">
                      {new Date(file.createdAt).toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions row triggers (Rename, Favor, Purge) */}
                    <td className="px-3 py-1.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {activeTab !== 'trash' ? (
                          <>
                            <button
                              id={`fav-btn-list-${file.id}`}
                              onClick={() => onToggleFavorite(file.id)}
                              className={`p-1 rounded border cursor-pointer ${file.isFavorite ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-neutral-200 text-neutral-400 hover:text-rose-500 hover:bg-neutral-50'}`}
                            >
                              <Heart size={11} className={file.isFavorite ? 'fill-current' : ''} />
                            </button>
                            
                            <button
                              id={`rename-btn-list-${file.id}`}
                              onClick={(e) => handleStartRename(e, file)}
                              className="p-1 rounded border border-neutral-200 bg-white text-neutral-400 hover:text-black hover:bg-neutral-50 cursor-pointer"
                            >
                              <Edit3 size={11} />
                            </button>

                            <button
                              id={`dl-btn-list-${file.id}`}
                              onClick={(e) => handleDownload(e, file)}
                              className="p-1 rounded border border-neutral-200 bg-white text-neutral-400 hover:text-black hover:bg-neutral-50 cursor-pointer"
                            >
                              <Download size={11} />
                            </button>

                            <button
                              id={`del-btn-list-${file.id}`}
                              onClick={() => onDelete(file.id)}
                              className="p-1 rounded border border-neutral-200 bg-white text-neutral-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              id={`restore-btn-list-${file.id}`}
                              onClick={() => onRestore?.(file.id)}
                              className="px-2 py-0.5 text-[9px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw size={9} />
                              <span>Khôi phục</span>
                            </button>
                            
                            <button
                              id={`purge-btn-list-${file.id}`}
                              onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tệp này? Thao tác này không thể hoàn tác.')) {
                                  onDelete(file.id);
                                }
                              }}
                              className="p-1 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite Scroll / Load more bottom trigger bar */}
      {hasMore && (
        <div id="pagination-panel" className="pt-2 flex justify-center pb-8">
          <button
            id="btn-load-more"
            onClick={handleLoadMoreTrigger}
            disabled={isLoadingChunk}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 cursor-pointer transition-all disabled:opacity-50 select-none shadow-3xs"
          >
            {isLoadingChunk ? (
              <>
                <Loader2 size={12} className="animate-spin text-neutral-500" />
                <span className="font-sans text-[11px]">Đang nạp thêm...</span>
              </>
            ) : (
              <>
                <ChevronDown size={12} className="animate-bounce" />
                <span className="font-sans text-[11px] font-semibold">Tải thêm tệp tin tối ưu</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Responsive Multi-Select Actions Drawer Panel Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white rounded-xl shadow-2xl border border-neutral-800 px-3.5 py-2.5 flex items-center gap-3 sm:gap-4 animate-slideUp font-sans max-w-lg w-[92%] sm:w-auto">
          <div className="flex items-center space-x-1 border-r border-neutral-800 pr-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold font-mono">{selectedIds.length} đã chọn</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto shrink-0">
            {/* Bulk Favorite Toggle */}
            {activeTab !== 'trash' && (
              <button
                onClick={() => onBulkToggleFavorite(selectedIds)}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white transition-colors cursor-pointer text-[10.5px] font-medium shrink-0"
                title="Yêu thích hàng loạt"
              >
                <Heart size={11} className="text-rose-400 fill-current" />
                <span className="hidden sm:inline">Ưa thích</span>
              </button>
            )}

            {/* Bulk Rename */}
            {activeTab !== 'trash' && (
              <button
                onClick={() => {
                  const base = window.prompt('Nhập tên cơ sở mới cho các tệp đã chọn (hệ thống tự động thêm chỉ số _(1), _(2)... vào sau):');
                  if (base && base.trim()) {
                    onBulkRename(selectedIds, base.trim());
                  }
                }}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white transition-colors cursor-pointer text-[10.5px] font-medium shrink-0"
                title="Đổi tên hàng loạt"
              >
                <Edit3 size={11} className="text-blue-400" />
                <span className="hidden sm:inline">Đổi tên</span>
              </button>
            )}

            {/* Bulk Restore if Trash */}
            {activeTab === 'trash' && onBulkRestore && (
              <button
                onClick={() => onBulkRestore(selectedIds)}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white transition-colors cursor-pointer text-[10.5px] font-medium shrink-0"
                title="Khôi phục hàng loạt"
              >
                <RotateCcw size={11} className="text-emerald-400" />
                <span className="hidden sm:inline">Khôi phục</span>
              </button>
            )}

            {/* Bulk Delete */}
            <button
              onClick={() => {
                if (activeTab === 'trash') {
                  if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ tệp trong thùng rác không? Thao tác này không thể khôi phục.')) {
                    onEmptyTrash?.();
                  }
                } else {
                  if (window.confirm('Xác nhận đưa các tệp đã chọn vào thùng rác?')) {
                    onBulkDelete(selectedIds);
                  }
                }
              }}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-red-950 text-red-300 hover:bg-red-900 hover:text-red-100 transition-colors cursor-pointer text-[10.5px] font-semibold shrink-0"
              title={activeTab === 'trash' ? 'Xóa vĩnh viễn toàn bộ thùng rác' : 'Xóa tạm thời'}
            >
              <Trash2 size={11} />
              <span>{activeTab === 'trash' ? 'Vĩnh viễn' : 'Xóa'}</span>
            </button>
          </div>

          {/* Deselect All Trigger */}
          <button
            onClick={() => onSelectedIdsChange([])}
            className="text-[9.5px] font-mono hover:underline text-neutral-400 hover:text-white cursor-pointer ml-auto bg-neutral-800 px-1.5 py-0.5 rounded"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
