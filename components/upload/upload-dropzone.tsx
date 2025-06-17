"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DROPZONE_CONFIG } from "@/lib/upload-utils";
import { Upload } from "lucide-react";
import { useDropzone } from 'react-dropzone';

interface UploadDropzoneProps {
  onDrop: (files: File[]) => void;
}

export function UploadDropzone({ onDrop }: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    ...DROPZONE_CONFIG
  });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl">拖拽上傳文件</CardTitle>
        <CardDescription>
          支援圖片 (PNG, JPG, GIF, WebP) 和 PDF 文件，PDF 將自動轉換為圖片供AI分析，最大 10MB
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
  );
} 