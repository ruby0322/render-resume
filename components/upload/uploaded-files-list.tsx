"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, UploadedFile } from "@/lib/upload-utils";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText, X } from "lucide-react";
import Image from 'next/image';

interface UploadedFilesListProps {
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

export function UploadedFilesList({ uploadedFiles, onRemoveFile }: UploadedFilesListProps) {
  if (uploadedFiles.length === 0) return null;

  return (
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
              className={cn(`relative flex flex-col space-y-4 p-4 rounded-lg transition-all`,
                uploadFile.status === 'uploading' || uploadFile.status === 'converting'
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
                    {formatFileSize(uploadFile.file.size)} MB
                    {uploadFile.type === 'pdf' && uploadFile.convertedImages && (
                      <span className="ml-2 text-cyan-600">
                        → {uploadFile.convertedImages.length} 張圖片
                      </span>
                    )}
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
                  {uploadFile.status === 'converting' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-orange-600 dark:text-orange-400">轉換中</span>
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
                  onClick={() => onRemoveFile(uploadFile.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* PDF Converted Images Preview */}
              {uploadFile.type === 'pdf' && uploadFile.convertedImages && uploadFile.convertedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    轉換後的圖片預覽：
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {uploadFile.convertedImages.slice(0, 8).map((img, index) => (
                      <div key={index} className="relative">
                        <Image 
                          width={128}
                          height={128}
                          src={img}   
                          alt={`PDF頁面 ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                    {uploadFile.convertedImages.length > 8 && (
                      <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          +{uploadFile.convertedImages.length - 8} 更多
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 