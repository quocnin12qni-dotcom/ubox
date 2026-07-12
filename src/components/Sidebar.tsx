/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  Heart, 
  Trash2, 
  Palette,
  HardDrive,
  RefreshCw,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { ActiveTab, AppTheme } from '../types';
import { getCategoryTotalCount, clearAllVirtualOverrides, initStorageEngine, getStorageStats } from '../db';
import { formatBytes } from '../utils';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  onResetDatabase: () => void;
  counts: {
    images: number;
    videos: number;
    files: number;
    favorites: number;
    trash: number;
  };
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  onResetDatabase,
  counts
}: SidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);

  const stats = getStorageStats();
  const percentageUsed = stats.capacityBytes > 0 ? (stats.usedBytes / stats.capacityBytes) * 100 : 0;
  const percentageFree = Math.max(0, 100 - percentageUsed);

  // Helper to format counts beautifully (e.g. 104,520 -> 104.5k)
  const formatCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num;
  };

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    count: number | null;
    colorClass?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, count: null },
    { id: 'image', label: '📷 Ảnh', icon: ImageIcon, count: counts.images },
    { id: 'video', label: '🎥 Video', icon: Film, count: counts.videos },
    { id: 'file', label: '📁 Tệp tin', icon: FileText, count: counts.files },
    { id: 'favorite', label: 'Yêu thích', icon: Heart, count: counts.favorites, colorClass: 'text-rose-500' },
    { id: 'trash', label: 'Thùng rác', icon: Trash2, count: counts.trash },
  ];

  const accentColors = [
    { value: '#000000', label: 'Đen Nhã Nhặn', bg: 'bg-black' },
    { value: '#3B82F6', label: 'Xanh Khởi Nghiệp', bg: 'bg-blue-500' },
    { value: '#10B981', label: 'Xanh Lá Tối Ưu', bg: 'bg-emerald-500' },
    { value: '#8B5CF6', label: 'Tím Hoàng Gia', bg: 'bg-violet-500' },
    { value: '#EF4444', label: 'Đỏ Năng Động', bg: 'bg-rose-500' },
  ];

  const handleReset = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại kho lưu trữ? Toàn bộ ảnh đã tải lên và các thay đổi yêu thích/thẻ xóa sẽ quay về mặc định.')) {
      await clearAllVirtualOverrides();
      onResetDatabase();
      alert('Đã khôi phục dữ liệu gốc thành công!');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full select-none text-white">
      {/* Brand Logo & Name */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white shadow-md border border-white/25">
            <HardDrive size={16} className="animate-pulse" />
          </div>
          <div>
            <span className="font-sans font-bold tracking-tight text-base text-white block">UBox Cloud</span>
            <span className="font-mono text-[8px] text-white/50 block tracking-widest">VN v2.4 PREMIUM</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-btn-${item.id}`}
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpenMobile(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-left
                ${isActive 
                  ? 'bg-white/20 text-white shadow-sm font-semibold scale-[1.01]' 
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon size={16} className={isActive ? 'text-white' : 'text-white/70'} />
                <span className="font-sans text-xs font-medium pr-2">{item.label}</span>
              </div>
              {item.count !== null && item.count > 0 && (
                <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full border transition-all duration-200
                  ${isActive 
                    ? 'bg-white/30 text-white border-white/20' 
                    : 'bg-white/10 text-white/80 border-white/10'
                  }`}
                >
                  {formatCount(item.count)}
                </span>
              )}
            </button>
          );
        })}

        {/* Custom Styling Separator */}
        <div className="pt-6 pb-2 border-t border-white/10 mt-6">
          <span className="font-mono text-[10px] uppercase text-white/50 tracking-wider font-semibold block px-3">
            Điều khiển hệ thống
          </span>
        </div>

        {/* Cài đặt giao diện Trực Tiếp */}
        <button
          id="btn-toggle-theme-panel"
          onClick={() => setShowThemePanel(!showThemePanel)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-left
            ${showThemePanel 
              ? 'bg-white/20 text-white font-semibold' 
              : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
        >
          <div className="flex items-center space-x-3">
            <Palette size={17} className="text-white/70" />
            <span className="font-sans text-sm">Giao diện & Tông màu</span>
          </div>
          <span className="text-[11px] text-white/50">❖</span>
        </button>

        {showThemePanel && (
          <div className="mx-2 mt-2 p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-4 animate-fadeIn transition-all">
            {/* Mode selection */}
            <div>
              <span className="text-[11px] font-medium text-white/60 block mb-1.5">Kiểu Giao Diện</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['light', 'dark'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTheme({ ...theme, themeMode: m })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center cursor-pointer transition-all capitalize
                      ${theme.themeMode === m 
                        ? 'bg-white text-black font-semibold border-white shadow-sm' 
                        : 'bg-white/10 text-white border-transparent hover:bg-white/20'
                      }`}
                  >
                    {m === 'light' ? 'Sáng' : 'Tối'}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent selection */}
            <div>
              <span className="text-[11px] font-medium text-white/60 block mb-1.5">Màu Sắc Nhấn</span>
              <div className="flex flex-wrap gap-1.5">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    title={color.label}
                    onClick={() => setTheme({ ...theme, primaryColor: color.value })}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-all relative flex items-center justify-center ${color.bg} hover:scale-110 border border-white/20`}
                  >
                    {theme.primaryColor === color.value && (
                      <span className="absolute w-2 h-2 rounded-full bg-white shadow-sm"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Reset storage trigger */}
            <button
              id="btn-db-reset"
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-red-300/30 text-rose-200 bg-red-950/40 hover:bg-red-950/60 cursor-pointer transition-all italic mt-2"
            >
              <RefreshCw size={11} />
              <span>Khôi phục dung lượng gốc</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Footer Info */}
      <div className="p-4 border-t border-white/10 bg-black/15">
        <div className="flex items-center space-x-2 text-white/90 text-xs mb-1.5">
          <Sparkles size={11} className="text-amber-300 animate-bounce" />
          <span className="font-sans font-medium text-[11px]">Trạng thái Đám Mây</span>
        </div>
        <p className="font-sans text-[10px] text-white/60 leading-relaxed mb-2.5">
          Không yêu cầu đăng nhập. Hệ thống bảo mật lưu trữ cục bộ IndexedDB tối ưu hóa hiệu suất tốc độ cao.
        </p>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full" style={{ width: `${percentageUsed}%` }}></div>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-white/50 md:text-[10px]">
          <span>Đã dùng {formatBytes(stats.usedBytes)}</span>
          <span>Trống {percentageFree.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar with Burger toggling */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm fixed top-0 left-0 right-0 z-40 h-14 select-none">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold">
            <HardDrive size={15} />
          </div>
          <span className="font-sans font-extrabold text-sm tracking-tight text-neutral-900">UBox Cloud VN</span>
        </div>
        <button
          id="btn-burger"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-1.5 text-neutral-600 bg-neutral-100 rounded-lg focus:outline-none cursor-pointer"
        >
          {isOpenMobile ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Desktop Persistent Drawer */}
      <div className="hidden md:block w-56 h-screen border-r border-white/10 fixed left-0 top-0 bottom-0 z-30 shadow-sm transition-all duration-300 text-white animate-fadeIn" style={{ backgroundColor: theme.primaryColor }}>
        <SidebarContent />
      </div>

      {/* Mobile Backdrop Slideout drawer menu */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Transparent click backdrop overlay to close */}
          <div 
            onClick={() => setIsOpenMobile(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          ></div>
          
          {/* Sliding drawer panel */}
          <div className="relative flex flex-col w-5/6 max-w-sm h-full shadow-2xl animate-slideRight transition-all duration-300 text-white" style={{ backgroundColor: theme.primaryColor }}>
            <div className="absolute top-4 right-4 z-10">
              <button 
                id="btn-close-drawer"
                onClick={() => setIsOpenMobile(false)} 
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
