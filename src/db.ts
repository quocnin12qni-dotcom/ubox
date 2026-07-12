/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileItem, FileType, StorageStats } from './types';

// Constants for Virtual Data counts
const VIRTUAL_IMAGE_COUNT = 0;
const VIRTUAL_VIDEO_COUNT = 0;
const VIRTUAL_FILE_COUNT = 0;

// Deterministic seed lists to generate believable Vietnamese filenames and properties
const VIET_IMAGE_NOUNS = [
  'Ảnh phong cảnh', 'Bình minh', 'Hoàng hôn', 'Du lịch hè', 'Kỷ niệm gia đình',
  'Họp lớp niên khóa', 'Đà Lạt sương mù', 'Hội An phố cổ', 'Phú Quốc biển xanh',
  'Mâm cơm tất niên', 'Bánh mì đặc biệt', 'Phở bò Hà Nội', 'Cà phê sữa đá',
  'Hồ Gươm chiều thu', 'Vịnh Hạ Long', 'Checkin Fansipan', 'Homestay Tây Bắc',
  'Dã ngoại cuối tuần', 'Vườn hoa cúc họa mi', 'Trung thu phố lồng đèn'
];

const VIET_VIDEO_NOUNS = [
  'Review ẩm thực đường phố', 'Vlog một ngày làm việc', 'Kế hoạch phát triển phần mềm',
  'Hướng dẫn học lập trình React', 'Highlight Việt Nam đá bóng', 'Đám cưới anh Tú chị Vi',
  'Phim tài liệu lịch sử', 'Mở hộp điện thoại mới', 'Review Homestay Sapa',
  'Teaser dự án khởi nghiệp', 'Time-lapse thành phố về đêm', 'Chạy bộ buổi sáng hồ Tây',
  'Nhạc chill lofi làm việc', 'Tập yoga tại nhà', 'Chia sẻ kinh nghiệm đầu tư'
];

const VIET_FILE_NOUNS = [
  'Báo cáo tài chính Q1', 'Kế hoạch Marketing năm 2026', 'Hợp đồng cộng tác viên',
  'Tài liệu đặc tả hệ thống', 'Slide giới thiệu sản phẩm', 'Danh sách khách hàng',
  'Source code Frontend', 'Thiết kế Mockup UI-UX', 'Cấu hình Docker Compose',
  'Ứng dụng UBox Android', 'Bản vẽ CAD nhà phố', 'Bài tập lớn hệ điều hành',
  'Sách kỹ năng giao tiếp', 'Hóa đơn dịch vụ đám mây', 'Tổng kết thi đua quý'
];

const FILE_EXTENSIONS = {
  image: ['jpg', 'png', 'webp', 'heic'],
  video: ['mp4', 'mkv', 'mov', 'webm'],
  file: ['pdf', 'xlsx', 'docx', 'zip', 'rar', 'pptx', 'psd', 'apk']
};

/**
 * Deterministic pseudo-random number generator to ensure stability of virtual data
 */
function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function getSeededRandom(seed: number) {
  return sfc32(seed, seed + 1, seed + 2, seed + 3);
}

/**
 * Get category-specific parameters deterministically based on index
 */
export function getVirtualItem(index: number, type: FileType): FileItem {
  const seed = index + (type === 'image' ? 100000 : type === 'video' ? 300000 : 500000);
  const rand = getSeededRandom(seed);
  
  let name = '';
  let extension = '';
  let mimeType = '';
  let size = 0;
  let duration: string | undefined;
  let url = '';
  
  const extList = FILE_EXTENSIONS[type];
  const selectedExt = extList[Math.floor(rand() * extList.length)];
  extension = selectedExt;

  if (type === 'image') {
    const nouns = VIET_IMAGE_NOUNS;
    const baseName = nouns[Math.floor(rand() * nouns.length)];
    name = `${baseName}_${index + 1}.${extension}`;
    mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    // Size between 500 KB and 8 MB
    size = Math.floor(rand() * 7500000) + 500000;
    // Map to stable beautiful curated images for visual appeal
    const imgId = Math.floor(rand() * 1000);
    url = `https://picsum.photos/id/${(imgId % 80) + 10}/800/600`;
  } else if (type === 'video') {
    const nouns = VIET_VIDEO_NOUNS;
    const baseName = nouns[Math.floor(rand() * nouns.length)];
    name = `${baseName}_${index + 1}.${extension}`;
    mimeType = `video/${extension === 'jpg' ? 'mp4' : extension}`;
    // Size between 10 MB and 450 MB
    size = Math.floor(rand() * 440000000) + 10000000;
    
    // Duration
    const mins = Math.floor(rand() * 15) + 1;
    const secs = Math.floor(rand() * 60);
    duration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // High-performance placeholder/thumbnail for video (using curated tech/nature static images)
    const imgId = Math.floor(rand() * 50);
    url = `https://picsum.photos/id/${(imgId % 40) + 100}/800/400`;
  } else {
    const nouns = VIET_FILE_NOUNS;
    const baseName = nouns[Math.floor(rand() * nouns.length)];
    name = `${baseName}_HồSơ_${index + 1}.${extension}`;
    
    if (extension === 'pdf') mimeType = 'application/pdf';
    else if (extension === 'zip') mimeType = 'application/zip';
    else if (extension === 'rar') mimeType = 'application/x-rar-compressed';
    else mimeType = 'application/octet-stream';
    
    // Size between 100 KB and 150 MB
    size = Math.floor(rand() * 149900000) + 100000;
  }

  // Generate a random stable date in the last 2 years
  const daysAgo = Math.floor(rand() * 730);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const createdAt = date.toISOString();

  const id = `virtual-${type}-${index}`;

  return {
    id,
    name,
    type,
    mimeType,
    size,
    createdAt,
    url,
    duration,
    extension,
    isFavorite: false,
    isDeleted: false,
    isVirtual: true
  };
}

/**
 * IndexedDB Wrapper for real uploaded files and state overrides on virtual items
 */
class IndexedDBService {
  private dbName = 'UBoxCloudStorage';
  private version = 1;
  private db: IDBDatabase | null = null;

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains('realFiles')) {
          db.createObjectStore('realFiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('virtualOverrides')) {
          db.createObjectStore('virtualOverrides', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  private getStore(name: 'realFiles' | 'virtualOverrides', mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database is not initialized');
    }
    const tx = this.db.transaction(name, mode);
    return tx.objectStore(name);
  }

  // Real files CRUD
  getRealFiles(): Promise<FileItem[]> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('realFiles', 'readonly');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        console.warn('IDB getRealFiles error, defaulting to empty', e);
        resolve([]);
      }
    });
  }

  saveRealFile(file: FileItem): Promise<void> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('realFiles', 'readwrite');
        const req = store.put(file);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (e) {
        console.warn('IDB saveRealFile error', e);
        resolve();
      }
    });
  }

  deleteRealFileDirect(id: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('realFiles', 'readwrite');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (e) {
        console.warn('IDB deleteRealFileDirect error', e);
        resolve();
      }
    });
  }

  // Virtual overrides (favourites, deletion status, renames for virtual items)
  getVirtualOverrides(): Promise<Record<string, Partial<FileItem>>> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('virtualOverrides', 'readonly');
        const req = store.getAll();
        req.onsuccess = () => {
          const result: Record<string, Partial<FileItem>> = {};
          const list = req.result || [];
          list.forEach((item: any) => {
            result[item.id] = item;
          });
          resolve(result);
        };
        req.onerror = () => resolve({});
      } catch (e) {
        console.warn('IDB getVirtualOverrides error', e);
        resolve({});
      }
    });
  }

  saveVirtualOverride(override: { id: string } & Partial<FileItem>): Promise<void> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('virtualOverrides', 'readwrite');
        // Fetch current override first
        const getReq = store.get(override.id);
        getReq.onsuccess = () => {
          const current = getReq.result || { id: override.id };
          const updated = { ...current, ...override };
          const req = store.put(updated);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        };
        getReq.onerror = () => {
          const req = store.put(override);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        };
      } catch (e) {
        console.warn('IDB saveVirtualOverride error', e);
        resolve();
      }
    });
  }

  clearVirtualOverrides(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const store = this.getStore('virtualOverrides', 'readwrite');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }
}

export const dbService = new IndexedDBService();

// State caching for runtime speed
let realFilesCached: FileItem[] = [];
let virtualOverridesCached: Record<string, Partial<FileItem>> = {};
let isDbInitialized = false;

export async function initStorageEngine(): Promise<void> {
  if (isDbInitialized) return;
  await dbService.init();
  realFilesCached = await dbService.getRealFiles();
  virtualOverridesCached = await dbService.getVirtualOverrides();
  isDbInitialized = true;
}

/**
 * Returns total file items count matching visual category (combines real & millions of virtual)
 */
export function getCategoryTotalCount(type: FileType | 'all', search: string = '', showDeleted: boolean = false): number {
  const searchLower = search.toLowerCase().trim();
  
  let count = 0;
  realFilesCached.forEach(f => {
    const isMatchedType = type === 'all' || f.type === type;
    const isMatchedDelete = f.isDeleted === showDeleted;
    const matchesSearch = searchLower === '' || 
      f.name.toLowerCase().includes(searchLower) ||
      f.extension.toLowerCase().includes(searchLower);
      
    if (isMatchedType && isMatchedDelete && matchesSearch) {
      count++;
    }
  });
  
  return count;
}

/**
 * Optimized Query method supporting complete client-side Virtual Infinite Scroll.
 * Blends actual uploaded IndexedDB records with dynamic seeded virtual items efficiently.
 */
export function queryFiles(
  type: FileType | 'all',
  searchQuery: string = '',
  status: 'active' | 'favorite' | 'deleted' = 'active',
  limit: number = 50,
  offset: number = 0,
  sortBy: 'name' | 'size' | 'date' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): { items: FileItem[]; totalCount: number } {
  
  const searchLower = searchQuery.toLowerCase().trim();

  // 1. Gather all real files matching criteria
  let matchedReal = realFilesCached.filter(f => {
    const matchesType = type === 'all' || f.type === type;
    const matchesSearch = searchLower === '' || 
      f.name.toLowerCase().includes(searchLower) ||
      f.extension.toLowerCase().includes(searchLower);
    
    let matchesStatus = false;
    if (status === 'deleted') {
      matchesStatus = f.isDeleted;
    } else if (status === 'favorite') {
      matchesStatus = !f.isDeleted && f.isFavorite;
    } else {
      matchesStatus = !f.isDeleted;
    }
    
    return matchesType && matchesSearch && matchesStatus;
  });

  // 2. Sort resulting items
  matchedReal.sort((a, b) => {
    let polarity = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name) * polarity;
    } else if (sortBy === 'size') {
      return (a.size - b.size) * polarity;
    } else {
      // date
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * polarity;
    }
  });

  // 3. Slice and return the specific offset -> limit page
  const slicedItems = matchedReal.slice(offset, offset + limit);

  return {
    items: slicedItems,
    totalCount: matchedReal.length
  };
}

/**
 * Upload a real file to the local storage engine.
 */
export async function uploadRealFile(
  name: string,
  type: FileType,
  mimeType: string,
  size: number,
  dataUrlOrBase64: string,
  duration?: string
): Promise<FileItem> {
  await initStorageEngine();
  
  const extension = name.split('.').pop() || 'bin';
  const newFile: FileItem = {
    id: `real-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    mimeType,
    size,
    createdAt: new Date().toISOString(),
    url: dataUrlOrBase64,
    duration,
    extension,
    isFavorite: false,
    isDeleted: false
  };

  await dbService.saveRealFile(newFile);
  realFilesCached.unshift(newFile); // Add to local memory cache at front
  
  return newFile;
}

/**
 * Deletes or triggers soft delete on file items
 */
export async function fileActionDelete(id: string): Promise<void> {
  await initStorageEngine();

  if (id.startsWith('real-')) {
    const file = realFilesCached.find(f => f.id === id);
    if (file) {
      if (file.isDeleted) {
        // Already in trash, perform PERMANENT removal
        await dbService.deleteRealFileDirect(id);
        realFilesCached = realFilesCached.filter(f => f.id !== id);
      } else {
        // Move to trash
        file.isDeleted = true;
        await dbService.saveRealFile(file);
      }
    }
  } else {
    // Virtual file
    const override = (virtualOverridesCached[id] || { id }) as { id: string } & Partial<FileItem>;
    if (override.isDeleted) {
      // Permanent delete on virtual item
      override.isDeleted = true;
      override.isFavorite = false;
      // Mark as permanently hidden by setting deleted property or a flag
      override.isPermanentlyDeleted = true; 
      await dbService.saveVirtualOverride(override);
      virtualOverridesCached[id] = override;
    } else {
      // Put to trash
      override.isDeleted = true;
      await dbService.saveVirtualOverride(override);
      virtualOverridesCached[id] = override;
    }
  }
}

/**
 * Restore file from soft deleted (Trash) to active
 */
export async function fileActionRestore(id: string): Promise<void> {
  await initStorageEngine();

  if (id.startsWith('real-')) {
    const file = realFilesCached.find(f => f.id === id);
    if (file) {
      file.isDeleted = false;
      await dbService.saveRealFile(file);
    }
  } else {
    const override = (virtualOverridesCached[id] || { id }) as { id: string } & Partial<FileItem>;
    override.isDeleted = false;
    await dbService.saveVirtualOverride(override);
    virtualOverridesCached[id] = override;
  }
}

/**
 * Toggle favorite status
 */
export async function fileActionToggleFavorite(id: string): Promise<boolean> {
  await initStorageEngine();

  if (id.startsWith('real-')) {
    const file = realFilesCached.find(f => f.id === id);
    if (file) {
      file.isFavorite = !file.isFavorite;
      await dbService.saveRealFile(file);
      return file.isFavorite;
    }
    return false;
  } else {
    const override = (virtualOverridesCached[id] || { id }) as { id: string } & Partial<FileItem>;
    const currentFav = !!override.isFavorite;
    override.isFavorite = !currentFav;
    await dbService.saveVirtualOverride(override);
    virtualOverridesCached[id] = override;
    return !!override.isFavorite;
  }
}

/**
 * Rename file
 */
export async function fileActionRename(id: string, newName: string): Promise<void> {
  await initStorageEngine();

  // Keep original extension if missing
  let targetName = newName;
  let originalExt: string | undefined;
  if (id.startsWith('real-')) {
    originalExt = realFilesCached.find(f => f.id === id)?.extension;
  } else if (id.startsWith('virtual-')) {
    const [, type, indexStr] = id.split('-');
    const index = parseInt(indexStr, 10);
    originalExt = getVirtualItem(index, type as FileType).extension;
  }

  if (originalExt && !targetName.toLowerCase().endsWith('.' + originalExt.toLowerCase())) {
    // Append previous extension
    const cleanName = targetName.endsWith('.') ? targetName.slice(0, -1) : targetName;
    targetName = `${cleanName}.${originalExt}`;
  }

  if (id.startsWith('real-')) {
    const file = realFilesCached.find(f => f.id === id);
    if (file) {
      file.name = targetName;
      // update extension
      file.extension = targetName.split('.').pop() || file.extension;
      await dbService.saveRealFile(file);
    }
  } else {
    const override = (virtualOverridesCached[id] || { id }) as { id: string } & Partial<FileItem>;
    override.name = targetName;
    override.extension = targetName.split('.').pop() || '';
    await dbService.saveVirtualOverride(override);
    virtualOverridesCached[id] = override;
  }
}

/**
 * Empty entire Trash
 */
export async function emptyTrash(): Promise<void> {
  await initStorageEngine();
  
  // Real files in trash get deleted permanently
  const realToDelete = realFilesCached.filter(f => f.isDeleted);
  for (const f of realToDelete) {
    await dbService.deleteRealFileDirect(f.id);
  }
  realFilesCached = realFilesCached.filter(f => !f.isDeleted);

  // Virtual overrides in trash get permanently flagged hidden
  const virtualTrashedIds = Object.keys(virtualOverridesCached).filter(id => virtualOverridesCached[id].isDeleted);
  for (const id of virtualTrashedIds) {
    const override = virtualOverridesCached[id] as { id: string } & Partial<FileItem>;
    override.isDeleted = true;
    override.isPermanentlyDeleted = true;
    override.isFavorite = false;
    await dbService.saveVirtualOverride(override);
    virtualOverridesCached[id] = override;
  }
}

/**
 * Calculate beautiful total summary of space and document indices
 */
export function getStorageStats(): StorageStats {
  // Let's add real sizes to our base virtual sizes
  let realImagesSize = 0;
  let realVideosSize = 0;
  let realFilesSize = 0;

  let realImagesCount = 0;
  let realVideosCount = 0;
  let realFilesCount = 0;

  realFilesCached.forEach(f => {
    if (!f.isDeleted) {
      if (f.type === 'image') {
        realImagesSize += f.size;
        realImagesCount++;
      } else if (f.type === 'video') {
        realVideosSize += f.size;
        realVideosCount++;
      } else {
        realFilesSize += f.size;
        realFilesCount++;
      }
    }
  });

  const totalUsedSize = realImagesSize + realVideosSize + realFilesSize;
  
  // Total Storage capacity: 15 GB exactly
  const capacityBytes = 15 * 1024 * 1024 * 1024; // 15 GB in binary bytes

  return {
    totalDocs: realImagesCount + realVideosCount + realFilesCount,
    totalImages: realImagesCount,
    totalVideos: realVideosCount,
    totalFiles: realFilesCount,
    usedBytes: totalUsedSize,
    capacityBytes: capacityBytes,
    imagesBytes: realImagesSize,
    videosBytes: realVideosSize,
    filesBytes: realFilesSize
  };
}

/**
 * Clear overrides and start clean
 */
export async function clearAllVirtualOverrides(): Promise<void> {
  await dbService.clearVirtualOverrides();
  virtualOverridesCached = {};
}
