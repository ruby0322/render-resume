"use client"

import Image from 'next/image';
import { pdfToImg } from 'pdftoimg-js/browser';
import { useState } from 'react';

const PdfToImageConverter = () => {
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const pdfUrl = URL.createObjectURL(file);
      const convertedImages = await pdfToImg(pdfUrl, {
        imgType: 'png',
        scale: 2,
        maxWidth: 4096,
        maxHeight: 4096,
        pages: 'all'
      });
      
      setImages(convertedImages);
      URL.revokeObjectURL(pdfUrl); // 釋放記憶體
    } catch (error) {
      console.error('轉換失敗:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4">
      <input 
        type="file" 
        accept="application/pdf"
        onChange={handleFileUpload}
        className="mb-4"
      />
      
      {isProcessing && <p>轉換中...</p>}
      
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, index) => (
          <Image 
            key={index}
            src={img}   
            alt={`PDF頁面 ${index + 1}`}
            className="border rounded shadow"
            width={400}
            height={400}
          />
        ))}
      </div>
    </div>
  );
};

export default PdfToImageConverter;
