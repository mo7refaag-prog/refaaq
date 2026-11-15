import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  compressedFile: File;
  originalSizeKB: number;
  compressedSizeKB: number;
  previewUrl: string;
}

/**
 * ضغط الصور بصرامة لتكون أقل من 100 كيلوبايت لضمان سرعة الرفع حتى على شبكات 2G/3G الضعيفة
 */
export async function compressReceiptImage(imageFile: File): Promise<CompressionResult> {
  const originalSizeKB = Math.round(imageFile.size / 1024);

  const options = {
    maxSizeMB: 0.09, // 90KB تقريباً لضمان البقاء تحت 100KB
    maxWidthOrHeight: 1280, // دقة مناسبة جداً لـ Tesseract.js والتعرف على الأرقام
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.75,
  };

  try {
    const compressedBlob = await imageCompression(imageFile, options);
    
    // تحويل الـ Blob إلى File باسم نظيف
    const cleanFileName = `receipt_${Date.now()}.jpg`;
    const compressedFile = new File([compressedBlob], cleanFileName, {
      type: 'image/jpeg',
    });

    const compressedSizeKB = Math.round(compressedFile.size / 1024);
    const previewUrl = URL.createObjectURL(compressedFile);

    return {
      compressedFile,
      originalSizeKB,
      compressedSizeKB,
      previewUrl,
    };
  } catch (error) {
    console.error('خطأ أثناء ضغط الصورة:', error);
    throw new Error('تعذر ضغط صورة الإشعار، يرجى المحاولة مرة أخرى');
  }
}
