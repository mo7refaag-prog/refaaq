import { createWorker } from 'tesseract.js';

export interface ExtractedReceiptData {
  amount: number | null;
  referenceNumber: string | null;
  date: string | null;
  recipientName: string | null;
  rawText: string;
  confidence: number;
}

// تحويل الأرقام العربية المشرقية (٠١٢٣٤٥٦٧٨٩) إلى أرقام لاتينية (0123456789)
export function normalizeArabicNumbers(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w).toString());
}

/**
 * معالجة بصرية مسبقة فائقة الدقة لإشعارات «بنكك» وتطبيقات البنوك السودانية:
 * إشعار بنكك يحتوي على خلفية خضراء داكنة مع نصوص بيضاء داخل إطارات رقيقة.
 * محرك Tesseract يفشل عادة في قراءة النص الأبيض على الخلفية الملونة.
 * نقوم هنا بتكبير الدقة (2.5x) وتحويل النص الأبيض إلى أسود داكن والخلفية إلى بيضاء نقية (Binarization).
 */
export async function preprocessBankakImage(fileOrUrl: File | string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // تكبير الأبعاد بنسبة 2.5x لتوضيح خطوط الأرقام الصغيرة
        const scale = Math.max(2, Math.min(3, 1400 / img.width));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(img.src);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // فحص كل بكسل: عزل النص الأبيض عن الخلفية الخضراء
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // في إشعار بنكك: النص الأبيض يحتوي على قيم R و B عالية (>145)، بينما اللون الأخضر له R و B منخفضان
          const isWhiteText =
            (r > 150 && b > 105) ||
            (r > 170 && g > 170 && b > 170) ||
            (r + g + b > 520);

          if (isWhiteText) {
            // تحويل النص إلى أسود نقي ليقرأه المحرك بسهولة
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else {
            // تحويل الخلفية الخضراء والخطوط الجانبية إلى أبيض نقي
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Preprocessing canvas error, falling back to original image:', e);
        resolve(img.src);
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      img.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

/**
 * استخراج بيانات إشعار بنكك وفوري بدقة عالية
 */
export async function extractReceiptData(
  imageSource: File | string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<ExtractedReceiptData> {
  let worker;
  try {
    if (onProgress) onProgress(15, 'جاري تحسين وضوح خطوط إشعار بنكك...');

    // 1. المعالجة البصرية المسبقة وعزل النص
    const preprocessedDataUrl = await preprocessBankakImage(imageSource);

    if (onProgress) onProgress(35, 'جاري تشغيل قارئ الإشعارات الذكي...');

    worker = await createWorker('ara+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const p = 35 + Math.round(m.progress * 60);
          onProgress(Math.min(95, p), 'جاري استخراج رقم العملية والمبلغ...');
        }
      },
    });

    const ret = await worker.recognize(preprocessedDataUrl);
    const rawText = ret.data.text;
    const confidence = ret.data.confidence;

    await worker.terminate();

    // تطبيع النص لإزالة التشكيل وتحويل الأرقام
    const normalizedText = normalizeArabicNumbers(rawText);

    // =========================================================================
    // 1. استخراج الرقم المرجعي / رقم العملية (Reference Number)
    // =========================================================================
    // في بنكك: رقم متسلسل من 10 إلى 14 خانة، مثل: 20061371602
    let extractedRef: string | null = null;

    // أ) بحث بجوار الكلمات الدلالية: رقم العملية، العملية، Ref No
    const refNearbyPattern = /(?:رقم\s*العملية|العملية|مرجعي|Ref|Trx)[\s\S]{0,25}?\b([0-9]{9,15})\b/i;
    const refNearbyMatch = normalizedText.match(refNearbyPattern);

    if (refNearbyMatch && refNearbyMatch[1]) {
      extractedRef = refNearbyMatch[1].trim();
    } else {
      // ب) في حال عدم قراءة الكلمة، التقاط الأرقام الطويلة المنفردة (باستثناء أرقام الحسابات المقسمة لمجموعات)
      const allLongNumbers = [...normalizedText.matchAll(/\b([0-9]{10,14})\b/g)].map((m) => m[1]);
      if (allLongNumbers.length > 0) {
        extractedRef = allLongNumbers[0];
      }
    }

    // =========================================================================
    // 2. استخراج المبلغ (Amount)
    // =========================================================================
    let extractedAmount: number | null = null;

    // في إشعار بنكك: المبلغ يظهر بتنسيق 277,000.00 أو 277.000.00 أو 15,000.00
    // وقبله أو بعده كلمة "المبلغ" أو يقرؤها الـ OCR كـ "wat" أو "الميلغ"
    const amountMatches = [
      ...normalizedText.matchAll(/\b([0-9]{1,3}(?:[.,][0-9]{3})+(?:\.[0-9]{2})?)\b/g),
    ].map((m) => m[1]);

    if (amountMatches.length > 0) {
      // آخر رقم منسق كعملة في الإشعار هو حقل المبلغ في أسفل الجدول
      const rawNumStr = amountMatches[amountMatches.length - 1];
      // تنظيف الفواصل والنقاط المفرقة للآلاف
      const cleanNum = parseFloat(
        rawNumStr.replace(/[.,](?=[0-9]{3})/g, '').replace(/,/g, '.')
      );
      if (!isNaN(cleanNum) && cleanNum > 0) {
        extractedAmount = cleanNum;
      }
    }

    // إذا لم يتطابق مع النمط المنسق، نفحص الأرقام الصريحة
    if (!extractedAmount) {
      const generalAmountPattern = /(?:المبلغ|wat|قيمة|Amount)[\s\S]{0,15}?\b([0-9]{4,8})\b/i;
      const m = normalizedText.match(generalAmountPattern);
      if (m && m[1]) {
        extractedAmount = parseFloat(m[1]);
      }
    }

    // الافتراضي لاشتراك الجمعية إذا لم يتم اكتشاف مبلغ غيره
    if (!extractedAmount) {
      extractedAmount = 15000;
    }

    // =========================================================================
    // 3. استخراج التاريخ (Date)
    // =========================================================================
    // في بنكك: 19-Sep-2024 أو 19-09-2024
    let extractedDate: string | null = null;
    const datePatterns = [
      /\b([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})\b/,
      /\b(20[2-3][0-9][-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01]))\b/,
      /\b((?:0?[1-9]|[12][0-9]|3[01])[-/](?:0?[1-9]|1[0-2])[-/]20[2-3][0-9])\b/,
    ];

    for (const dp of datePatterns) {
      const match = normalizedText.match(dp);
      if (match && match[1]) {
        extractedDate = match[1];
        break;
      }
    }

    // =========================================================================
    // 4. استخراج اسم المستلم / المرسل إليه
    // =========================================================================
    let extractedRecipient: string | null = null;
    const namePattern = /(?:إسم\s*المرسل\s*اليه|المرسل\s*اليه|اسم\s*المستفيد)[\s\S]{0,10}?([\u0621-\u064A\s]{6,35})/;
    const nameMatch = normalizedText.match(namePattern);
    if (nameMatch && nameMatch[1]) {
      extractedRecipient = nameMatch[1].trim();
    }

    return {
      amount: extractedAmount,
      referenceNumber: extractedRef,
      date: extractedDate,
      recipientName: extractedRecipient,
      rawText,
      confidence,
    };
  } catch (err) {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
    console.error('OCR Extraction error:', err);
    return {
      amount: 15000,
      referenceNumber: null,
      date: null,
      recipientName: null,
      rawText: '',
      confidence: 0,
    };
  }
}
