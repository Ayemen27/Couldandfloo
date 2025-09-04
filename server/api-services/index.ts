/**
 * تجميع جميع خدمات الـ API - يمكن استخدامها مع Express.js أو Next.js
 */
export { ProjectService } from './ProjectService';
export { WorkerService } from './WorkerService';
export { FundTransferService } from './FundTransferService';
export { MaterialService } from './MaterialService';
export { SupplierService } from './SupplierService';

// أنواع الاستجابات الموحدة
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// معالج الأخطاء المشترك
export function handleApiError(error: any): ApiResponse {
  const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
  return {
    success: false,
    error: message
  };
}

// معالج النجاح المشترك
export function handleApiSuccess<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}