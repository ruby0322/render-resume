"use client";

import {
    UploadedFile,
    clearUploadSession,
    generateFileId,
    getFileType,
    processFilesForAnalysis,
    saveToSession
} from '@/lib/upload-utils';
import { pdfToImg } from 'pdftoimg-js/browser';
import { useCallback, useEffect, useState } from 'react';

export function useFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [additionalText, setAdditionalText] = useState('');

  // Clear previous session data on mount
  useEffect(() => {
    clearUploadSession();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('📁 [File Upload Hook] Files dropped:', {
      filesCount: acceptedFiles.length,
      fileNames: acceptedFiles.map(f => f.name),
      fileSizes: acceptedFiles.map(f => f.size),
      fileTypes: acceptedFiles.map(f => f.type)
    });

    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      const fileType = getFileType(file);

      return {
        id: generateFileId(),
        file,
        type: fileType,
        status: 'uploading',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
    });

    console.log('📋 [File Upload Hook] Created upload file objects:', newFiles.map(f => ({
      id: f.id,
      name: f.file.name,
      type: f.type,
      status: f.status
    })));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process file upload and PDF conversion
    for (const uploadFile of newFiles) {
      try {
        if (uploadFile.type === 'pdf') {
          // PDF file needs conversion
          console.log(`🔄 [File Upload Hook] Converting PDF to images: ${uploadFile.file.name}`);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'converting' }
                : f
            )
          );

          const pdfUrl = URL.createObjectURL(uploadFile.file);
          const convertedImages = await pdfToImg(pdfUrl, {
            imgType: 'png',
            scale: 2,
            maxWidth: 4096,
            maxHeight: 4096,
            pages: 'all'
          });
          
          URL.revokeObjectURL(pdfUrl);
          
          console.log(`✅ [File Upload Hook] PDF converted to ${convertedImages.length} images: ${uploadFile.file.name}`);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'completed', convertedImages }
                : f
            )
          );
        } else {
          // Regular file - mark as completed
          setTimeout(() => {
            console.log(`✅ [File Upload Hook] File upload completed: ${uploadFile.file.name}`);
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === uploadFile.id 
                  ? { ...f, status: 'completed' }
                  : f
              )
            );
          }, 1000);
        }
      } catch (error) {
        console.error(`❌ [File Upload Hook] Error processing file ${uploadFile.file.name}:`, error);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error' }
              : f
          )
        );
      }
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const prepareForAnalysis = useCallback(async () => {
    console.log('🚀 [File Upload Hook] Starting file preparation for analysis');
    console.log('📊 [File Upload Hook] Current state:', {
      uploadedFilesCount: uploadedFiles.length,
      additionalTextLength: additionalText.length,
      canProceed: uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'completed')
    });
    
    if (uploadedFiles.length === 0) {
      console.warn('⚠️ [File Upload Hook] No files to process');
      throw new Error('No files to process');
    }
    
    setIsProcessing(true);
    
    try {
      console.log('📋 [File Upload Hook] Preparing files data');
      
      const allFilesData = await processFilesForAnalysis(uploadedFiles);
      
      console.log('📄 [File Upload Hook] All files data prepared (PDFs excluded, only converted images included):', allFilesData.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        isFromPdf: f.isFromPdf || false
      })));

      saveToSession(allFilesData, additionalText);
      
      console.log('🏁 [File Upload Hook] File preparation process completed');
      return allFilesData;
    } catch (error) {
      console.error('❌ [File Upload Hook] Error preparing files:', error);
      if (error instanceof Error) {
        console.error('❌ [File Upload Hook] Error message:', error.message);
        console.error('❌ [File Upload Hook] Error stack:', error.stack);
      }
      throw new Error('準備文件時發生錯誤，請重試');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFiles, additionalText]);

  const canProceed = uploadedFiles.length > 0 && uploadedFiles.every(f => f.status === 'completed');

  return {
    uploadedFiles,
    isProcessing,
    additionalText,
    setAdditionalText,
    onDrop,
    removeFile,
    prepareForAnalysis,
    canProceed
  };
} 