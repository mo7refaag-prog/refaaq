/**
 * أداة توليد ملفات PDF ومشاركتها في واتساب (Offline-First)
 * تدعم اللغة العربية بالكامل (RTL) بجودة طباعة فائقة الدقة (Vector/Retina).
 */

// بناء ملف PDF قياسي مطابق لمواصفات PDF 1.4 يحتوي على صورة عالية الدقة
export function buildPdfFromJpegBlob(jpegBytes: Uint8Array, widthPx: number, heightPx: number): Blob {
  const parts: BlobPart[] = [];
  const offsets: number[] = [];
  let pos = 0;

  function write(str: string) {
    parts.push(str);
    pos += new TextEncoder().encode(str).length;
  }

  function writeBytes(bytes: Uint8Array) {
    parts.push(bytes as unknown as BlobPart);
    pos += bytes.length;
  }

  // A4 Dimensions in Points (72 DPI)
  const a4W = 595.28;
  const a4H = 841.89;

  write('%PDF-1.4\n');

  // Object 1: Catalog
  offsets[1] = pos;
  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages Collection
  offsets[2] = pos;
  write('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Single Page
  offsets[3] = pos;
  write(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${a4W} ${a4H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Object 4: Image XObject
  offsets[4] = pos;
  write(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  writeBytes(jpegBytes);
  write('\nendstream\nendobj\n');

  // Object 5: Page Content Stream (scale image to fit A4 page)
  const contentStream = `q ${a4W} 0 0 ${a4H} 0 0 cm /Im0 Do Q`;
  offsets[5] = pos;
  write(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  // Cross-reference table
  const xrefPos = pos;
  write('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    write(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }

  // Trailer
  write(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return new Blob(parts, { type: 'application/pdf' });
}

// تنزيل ملف PDF مباشرة إلى جهاز المستخدم أو هاتفه
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

// مشاركة التقرير في قروب الواتساب (الملف + النص التوضيحي)
export async function shareOrSendToWhatsApp({
  title,
  text,
  pdfBlob,
  fileName,
}: {
  title: string;
  text: string;
  pdfBlob?: Blob;
  fileName?: string;
}): Promise<boolean> {
  // 1. محاولة المشاركة الأصلية المباشرة (Web Share API) لملف الـ PDF
  if (pdfBlob && fileName && typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return true;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('تعذر الإرسال المباشر للملف عبر المتصفح:', err);
      }
    }
  }

  // 2. إذا لم يكن إرسال الملفات مدعوماً، نقوم بتنزيل الـ PDF تلقائياً، ونفتح واتساب بالنص المنسق
  if (pdfBlob && fileName) {
    downloadBlob(pdfBlob, fileName);
  }

  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
  return true;
}
