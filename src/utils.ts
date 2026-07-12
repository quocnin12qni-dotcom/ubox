/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileType } from './types';

/**
 * Format bytes to readable strings with Vietnamese sizing labels
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Maps document extensions to color styles and label titles
 */
export interface ExtStyleItem {
  iconText: string;
  bgColor: string;
  textColor: string;
  label: string;
}

export function getExtensionStyle(extension: string): ExtStyleItem {
  const ext = extension.toLowerCase().trim();
  
  switch (ext) {
    case 'pdf':
      return { iconText: 'PDF', bgColor: 'bg-red-50 text-red-600 border-red-200', textColor: 'text-red-600', label: 'Tài liệu PDF' };
    case 'xlsx':
    case 'xls':
    case 'csv':
      return { iconText: 'XLS', bgColor: 'bg-green-50 text-green-600 border-green-200', textColor: 'text-green-600', label: 'Bảng tính Excel' };
    case 'docx':
    case 'doc':
      return { iconText: 'DOC', bgColor: 'bg-blue-50 text-blue-600 border-blue-200', textColor: 'text-blue-600', label: 'Văn bản Word' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { iconText: 'ZIP', bgColor: 'bg-amber-50 text-amber-700 border-amber-200', textColor: 'text-amber-700', label: 'Nén kho lưu' };
    case 'pptx':
    case 'ppt':
      return { iconText: 'PPT', bgColor: 'bg-orange-50 text-orange-600 border-orange-200', textColor: 'text-orange-600', label: 'Slide trình chiếu' };
    case 'psd':
      return { iconText: 'PSD', bgColor: 'bg-sky-100 text-sky-700 border-sky-300', textColor: 'text-sky-700', label: 'Thiết kế Photoshop' };
    case 'apk':
      return { iconText: 'APK', bgColor: 'bg-lime-50 text-lime-700 border-lime-200', textColor: 'text-lime-700', label: 'Ứng dụng Android' };
    case 'txt':
    case 'md':
      return { iconText: 'TXT', bgColor: 'bg-gray-100 text-gray-700 border-gray-300', textColor: 'text-gray-700', label: 'Tập tin văn bản' };
    default:
      return { iconText: ext.toUpperCase().slice(0, 4), bgColor: 'bg-stone-50 text-stone-600 border-stone-200', textColor: 'text-stone-600', label: `Tệp tin ${ext.toUpperCase()}` };
  }
}

/**
 * Format string duration nicely
 */
export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 30) {
      // Return beautiful date format DD/MM/YYYY
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    
    if (diffDay > 0) return `${diffDay} ngày trước`;
    if (diffHr > 0) return `${diffHr} giờ trước`;
    if (diffMin > 0) return `${diffMin} phút trước`;
    return 'Vừa xong';
  } catch (e) {
    return 'Vừa xong';
  }
}
