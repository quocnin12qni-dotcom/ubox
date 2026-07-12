/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FileType = 'image' | 'video' | 'file';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string; // Object URL, Base64 data, or custom placeholder
  duration?: string; // For videos, e.g. "03:15"
  extension: string; // e.g. "pdf", "zip", "png", etc.
  isFavorite: boolean;
  isDeleted: boolean;
  isVirtual?: boolean;
  isPermanentlyDeleted?: boolean;
  thumbnailUrl?: string;
}

export interface StorageStats {
  totalDocs: number;
  totalImages: number;
  totalVideos: number;
  totalFiles: number;
  usedBytes: number;
  capacityBytes: number;
  imagesBytes?: number;
  videosBytes?: number;
  filesBytes?: number;
}

export interface UploadProgress {
  id: string;
  name: string;
  size: number;
  progress: number; // 0 to 100
  speed: string; // e.g. "2.4 MB/s"
  timeRemaining: string; // e.g. "5 giây"
  status: 'uploading' | 'completed' | 'failed';
}

export type ViewMode = 'grid' | 'list';

export type ActiveTab = 'dashboard' | 'image' | 'video' | 'file' | 'favorite' | 'trash' | 'settings';

export interface AppTheme {
  primaryColor: string;
  themeMode: 'light' | 'dark' | 'glass';
}
