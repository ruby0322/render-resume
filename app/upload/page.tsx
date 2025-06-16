"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Upload,
  X
} from "lucide-react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'document' | 'image';
  status: 'uploading' | 'completed' | 'error';
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [additionalText, setAdditionalText] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('📁 [Upload Page] Files dropped:', {
      filesCount: acceptedFiles.length,
      fileNames: acceptedFiles.map(f => f.name),
      fileSizes: acceptedFiles.map(f => f.size),
      fileTypes: acceptedFiles.map(f => f.type)
    });

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      status: 'uploading',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    console.log('📋 [Upload Page] Created upload file objects:', newFiles.map(f => ({
      id: f.id,
      name: f.file.name,
      type: f.type,
      status: f.status
    })));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // 模擬上傳過程
    newFiles.forEach((uploadFile, index) => {
      setTimeout(() => {
        console.log(`✅ [Upload Page] File upload completed: ${uploadFile.file.name}`);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed' }
              : f
          )
        );
      }, 1000 + index * 500);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleNext = async () => {
    console.log('🚀 [Upload Page] Starting file preparation for analysis');
    console.log('📊 [Upload Page] Current state:', {
      uploadedFilesCount: uploadedFiles.length,
      additionalTextLength: additionalText.length,
      canProceed
    });
    
    if (uploadedFiles.length === 0) {
      console.warn('⚠️ [Upload Page] No files to process');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('📋 [Upload Page] Preparing files data');
      // 將文件和額外資訊存儲到 sessionStorage
      const filesData = uploadedFiles.map(uf => ({
        id: uf.id,
        name: uf.file.name,
        type: uf.file.type,
        size: uf.file.size,
        lastModified: uf.file.lastModified
      }));
      
      console.log('📄 [Upload Page] Files data prepared:', filesData);
      
      console.log('🔄 [Upload Page] Converting files to base64');
      // 將文件轉換為 base64 存儲
      const filesWithContent = await Promise.all(
        uploadedFiles.map(async (uf, index) => {
          console.log(`📄 [Upload Page] Converting file ${index + 1}/${uploadedFiles.length}: ${uf.file.name}`);
          const base64 = await fileToBase64(uf.file);
          console.log(`✅ [Upload Page] File converted: ${uf.file.name} (base64 length: ${base64.length})`);
          return {
            ...filesData.find(fd => fd.id === uf.id),
            content: base64,
            preview: uf.preview
          };
        })
      );

      console.log('💾 [Upload Page] Storing data in sessionStorage');
      sessionStorage.setItem('uploadedFiles', JSON.stringify(filesWithContent));
      sessionStorage.setItem('additionalText', additionalText);
      
      console.log('📊 [Upload Page] SessionStorage data stored:', {
        uploadedFilesSize: JSON.stringify(filesWithContent).length,
        additionalTextSize: additionalText.length
      });
      
      console.log('🧭 [Upload Page] Navigating to analyze page');
      // 導航到解析頁面
      router.push('/analyze');
    } catch (error) {
      console.error('❌ [Upload Page] Error preparing files:', error);
      if (error instanceof Error) {
        console.error('❌ [Upload Page] Error message:', error.message);
        console.error('❌ [Upload Page] Error stack:', error.stack);
      }
      alert('準備文件時發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
      console.log('🏁 [Upload Page] File preparation process completed');
    }
  };

  // 將文件轉換為 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const canProceed = uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'completed');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            上傳您的作品
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            上傳作品說明文件、截圖或任何能展示您能力的材料。AI將自動分析並提取重要信息。
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">拖拽上傳文件</CardTitle>
            <CardDescription>
              支持 PDF、Word 文檔、圖片 (PNG, JPG, GIF, WebP)、文本文件 (TXT, MD, JSON, CSV)，最大 10MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                ${isDragActive 
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-cyan-600 dark:text-cyan-400 text-lg">
                  鬆開以上傳文件
                </p>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
                    拖拽文件到這裡，或點擊選擇文件
                  </p>
                  <p className="text-sm text-gray-500">
                    支持多個文件同時上傳
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Text Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">額外資訊</CardTitle>
            <CardDescription>
              提供任何額外的背景資訊或特殊要求
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              placeholder="例如：應徵職位、特殊技能、項目背景等..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">已上傳文件</CardTitle>
              <CardDescription>
                {uploadedFiles.length} 個文件已上傳
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.map((uploadFile) => (
                  <div 
                    key={uploadFile.id} 
                    className={cn(`relative flex items-center space-x-4 p-4 rounded-lg transition-all`,
                      uploadFile.status === 'uploading' 
                        ? 'border-2 border-cyan-200 dark:border-cyan-800' 
                        : 'border border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <div className="relative z-10 flex items-center space-x-4 w-full bg-white dark:bg-gray-800 rounded-lg">
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {uploadFile.type === 'image' && uploadFile.preview ? (
                          <Image 
                            width={128}
                            height={128}
                            src={uploadFile.preview} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        {uploadFile.status === 'uploading' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-cyan-600 dark:text-cyan-400">上傳中</span>
                          </div>
                        )}
                        {uploadFile.status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">✅</span>
                            <span className="text-sm text-green-600">完成</span>
                          </div>
                        )}
                        {uploadFile.status === 'error' && (
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-600">錯誤</span>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">上傳建議</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <span className="text-lg mt-1">📄</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">項目文檔</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    包含項目描述、技術棧、成果的文檔
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg mt-1">🖼️</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">截圖展示</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    產品界面、代碼截圖、設計作品等
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            返回首頁
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed || isProcessing}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                準備中...
              </>
            ) : (
              <>
                開始分析
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 