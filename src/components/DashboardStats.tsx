/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Image as ImageIcon, 
  Film, 
  FileText, 
  HardDrive,
  Database,
  CloudLightning,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { StorageStats } from '../types';
import { formatBytes } from '../utils';

interface DashboardStatsProps {
  stats: StorageStats;
  themeColor: string;
}

export default function DashboardStats({ stats, themeColor }: DashboardStatsProps) {
  const percentageUsed = (stats.usedBytes / stats.capacityBytes) * 100;
  const percentageFormatted = percentageUsed.toFixed(1);
  const remainingBytes = Math.max(0, stats.capacityBytes - stats.usedBytes);

  // Categories details cards array
  const detailCards = [
    {
      title: '📷 Ảnh kỹ thuật số',
      count: stats.totalImages,
      size: stats.imagesBytes || 0, // Real weight calculation
      color: 'border-emerald-200 bg-emerald-50/20 text-emerald-700',
      iconBg: 'bg-emerald-100/80',
      icon: ImageIcon,
      avgSize: 'Ảnh',
      speed: 'Tải cực nhanh'
    },
    {
      title: '🎥 Video độ phân giải cao',
      count: stats.totalVideos,
      size: stats.videosBytes || 0, // Real weight calculation
      color: 'border-blue-200 bg-blue-50/20 text-blue-700',
      iconBg: 'bg-blue-100/80',
      icon: Film,
      avgSize: 'Video',
      speed: 'Stream trực tiếp'
    },
    {
      title: '📁 Tài liệu & Tệp tin khác',
      count: stats.totalFiles,
      size: stats.filesBytes || 0, // Real weight calculation
      color: 'border-amber-200 bg-amber-50/20 text-amber-800',
      iconBg: 'bg-amber-100/80',
      icon: FileText,
      avgSize: 'Tài liệu',
      speed: 'Bảo mật Index'
    }
  ];

  // SVG calculations for visual gauge ring
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageUsed / 100) * circumference;

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Title greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight text-neutral-900 flex items-center gap-2">
            <span>Trung tâm Lưu trữ Số</span>
            <span className="text-xs font-mono bg-neutral-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">PRENIUM</span>
          </h1>
          <p className="font-sans text-xs md:text-sm text-neutral-500 mt-1">
            Hệ thống UBox tối ưu hóa bộ nhớ đệm, tự động nén dung lượng tải lên và duy trì tìm kiếm trên các tệp tin lưu trữ của bạn.
          </p>
        </div>
        
        {/* Badge showing local node info in Vietnam */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-neutral-100/70 border border-neutral-200/50 self-start md:self-center">
          <Cpu size={14} className="text-neutral-500 animate-spin-slow" />
          <div className="text-left leading-none">
            <span className="font-mono text-[9px] text-neutral-400 block">MÁY CHỦ HIỆN TẠI</span>
            <span className="font-sans text-[10px] font-bold text-neutral-800">Cơ sở dữ liệu IndexedDB</span>
          </div>
        </div>
      </div>

      {/* Main Storage breakdown & circular gauge bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ring storage widget */}
        <div className="lg:col-span-1 p-6 bg-white border border-neutral-100 shadow-sm rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <HardDrive size={70} className="text-neutral-400" />
          </div>
          
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-400 block mb-3.5">
            Tổng Dung Lượng Đĩa
          </span>
          
          {/* Radial layout */}
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-95">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-neutral-100"
                strokeWidth="11"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke={themeColor}
                strokeWidth="11"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="font-mono font-extrabold text-2xl text-neutral-900 block leading-none">
                {percentageFormatted}%
              </span>
              <span className="font-sans text-[10px] text-neutral-400 mt-1 block">ĐÃ DÙNG</span>
            </div>
          </div>

          <div className="w-full mt-5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-sans flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-black" style={{ backgroundColor: themeColor }}></span>
                Đã sử dụng:
              </span>
              <span className="font-mono font-bold text-neutral-800">{formatBytes(stats.usedBytes)}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-neutral-50 pt-2">
              <span className="text-neutral-500 font-sans">Dung lượng trống:</span>
              <span className="font-mono text-neutral-800">{formatBytes(remainingBytes)}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-neutral-50 pt-2">
              <span className="text-neutral-500 font-sans">Tổng dung lượng:</span>
              <span className="font-mono font-bold text-neutral-800">{formatBytes(stats.capacityBytes)}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid Details Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {detailCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                id={`stat-card-${i}`}
                key={i} 
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${card.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded-md">
                    {card.speed}
                  </span>
                </div>

                <div className="mt-6">
                  <span className="font-sans font-medium text-xs text-neutral-500 block mb-1">
                    {card.title}
                  </span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-mono font-black text-xl md:text-2xl text-neutral-900">
                      {card.count.toLocaleString('vi-VN')}
                    </span>
                    <span className="font-sans text-[10px] text-neutral-400">tệp</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
                  <span className="font-sans text-neutral-500">Kích thước:</span>
                  <span className="font-mono font-semibold">{formatBytes(card.size)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cloud Speed Optimizations Notice banner */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl bg-neutral-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5">
          <CloudLightning size={120} />
        </div>
        
        <div className="flex items-center space-x-3.5 md:col-span-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
            <CloudLightning size={20} className="animate-bounce" />
          </div>
          <div>
            <span className="font-sans font-bold text-sm block">UBox Caching Optimization Hoạt Động</span>
            <span className="font-sans text-xs text-neutral-400 block mt-0.5">
              Hệ thống dùng thuật toán nén ảnh JPEG/PNG và tối ưu hóa thời lượng stream HTML5 video để xử lý mượt và tối ưu trải nghiệm lưu trữ của bạn.
            </span>
          </div>
        </div>
        
        <div className="flex items-center md:justify-end space-x-2 text-xs font-mono bg-white/5 p-3 rounded-xl border border-white/10">
          <TrendingUp size={14} className="text-emerald-400" />
          <span>Tốc độ tải xuống: ~2.4 Gbps</span>
        </div>
      </div>
    </div>
  );
}
