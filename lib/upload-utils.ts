export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'document' | 'image' | 'pdf';
  status: 'uploading' | 'completed' | 'error' | 'converting';
  convertedImages?: string[];
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  content: string;
  preview?: string;
  isFromPdf?: boolean;
  originalPdfName?: string;
}

// File type detection
export function getFileType(file: File): 'document' | 'image' | 'pdf' {
  if (file.type.startsWith('image/')) {
    return 'image';
  } else if (file.type === 'application/pdf') {
    return 'pdf';
  }
  return 'document';
}

// Generate unique ID for files
export function generateFileId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2);
}

// Session storage operations
export function clearUploadSession(): void {
  console.log('🧹 [Upload Utils] Clearing previous sessionStorage data');
  sessionStorage.removeItem('uploadedFiles');
  sessionStorage.removeItem('additionalText');
  sessionStorage.removeItem('analysisResult');
}

export function saveToSession(files: FileData[], additionalText: string): void {
  console.log('💾 [Upload Utils] Storing data in sessionStorage');
  sessionStorage.setItem('uploadedFiles', JSON.stringify(files));
  sessionStorage.setItem('additionalText', additionalText);
  
  console.log('📊 [Upload Utils] SessionStorage data stored:', {
    uploadedFilesSize: JSON.stringify(files).length,
    additionalTextSize: additionalText.length,
    totalFilesForModel: files.length
  });
}

// Dropzone configuration
export const DROPZONE_CONFIG = {
  accept: {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'application/json': ['.json'],
    'text/csv': ['.csv']
  },
  maxSize: 10 * 1024 * 1024 // 10MB
};

// Process uploaded files for analysis
export async function processFilesForAnalysis(uploadedFiles: UploadedFile[]): Promise<FileData[]> {
  const allFilesData: FileData[] = [];
  
  for (const uf of uploadedFiles) {
    if (uf.type === 'pdf' && uf.convertedImages) {
      // PDF文件：只添加轉換後的圖片，不添加原始PDF
      console.log(`📄 [Upload Utils] Processing PDF converted images for: ${uf.file.name} (原始PDF不會傳送給模型)`);
      for (let i = 0; i < uf.convertedImages.length; i++) {
        const imageBase64 = uf.convertedImages[i];
        const convertedFileName = `${uf.file.name.replace('.pdf', '')}_第${i + 1}頁.png`;
        console.log(`📄 [Upload Utils] Creating converted image file: "${convertedFileName}"`);
        
        allFilesData.push({
          id: `${uf.id}_page_${i + 1}`,
          name: convertedFileName,
          type: 'image/png',
          size: 0,
          lastModified: uf.file.lastModified,
          content: imageBase64,
          isFromPdf: true,
          originalPdfName: uf.file.name
        });
      }
      console.log(`✅ [Upload Utils] PDF ${uf.file.name} 轉換為 ${uf.convertedImages.length} 張圖片，原始PDF已排除`);
    } else if (uf.type !== 'pdf') {
      // 非PDF文件：正常轉換為base64
      console.log(`📄 [Upload Utils] Converting regular file: ${uf.file.name}`);
      const base64 = await fileToBase64(uf.file);
      allFilesData.push({
        id: uf.id,
        name: uf.file.name,
        type: uf.file.type,
        size: uf.file.size,
        lastModified: uf.file.lastModified,
        content: base64,
        preview: uf.preview
      });
    }
  }
  
  return allFilesData;
} 