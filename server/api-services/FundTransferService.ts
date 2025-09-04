/**
 * خدمة التحويلات المالية - معالجة منطق الأعمال للتحويلات والعهد
 * يمكن استخدامها مع Express.js أو Next.js API Routes
 */
import { storage } from "../storage";
import { insertFundTransferSchema, insertProjectFundTransferSchema } from "@shared/schema";

export class FundTransferService {
  
  // جلب جميع التحويلات
  static async getAllFundTransfers() {
    try {
      // استخدام projectId فارغ للحصول على جميع التحويلات
      const transfers = await storage.getFundTransfers('', '');
      return { success: true, data: transfers };
    } catch (error) {
      throw new Error("خطأ في جلب التحويلات");
    }
  }

  // جلب تحويلات مشروع معين
  static async getProjectFundTransfers(projectId: string, date?: string) {
    try {
      const transfers = await storage.getFundTransfers(projectId, date);
      return { success: true, data: transfers };
    } catch (error) {
      throw new Error("خطأ في جلب تحويلات المشروع");
    }
  }

  // إنشاء تحويل جديد
  static async createFundTransfer(transferData: any) {
    try {
      const validation = insertFundTransferSchema.safeParse(transferData);
      if (!validation.success) {
        throw new Error("بيانات الحولة غير صحيحة");
      }

      try {
        const transfer = await storage.createFundTransfer(validation.data);
        return { success: true, data: transfer };
      } catch (dbError: any) {
        if (dbError.code === '23505' && (
          dbError.constraint === 'fund_transfers_transfer_number_key' || 
          dbError.constraint === 'fund_transfers_transfer_number_unique'
        )) {
          throw new Error("يوجد تحويل بنفس رقم الحوالة مسبقاً");
        }
        
        if (dbError.code === '23503') {
          throw new Error("المشروع المحدد غير موجود");
        }
        
        throw dbError;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحولة");
    }
  }

  // تحديث تحويل
  static async updateFundTransfer(transferId: string, transferData: any) {
    try {
      const validation = insertFundTransferSchema.safeParse(transferData);
      if (!validation.success) {
        throw new Error("بيانات التحويل غير صحيحة");
      }

      try {
        const transfer = await storage.updateFundTransfer(transferId, validation.data);
        return { success: true, data: transfer };
      } catch (dbError: any) {
        if (dbError.code === '23505' && dbError.constraint === 'fund_transfers_transfer_number_key') {
          throw new Error("يوجد تحويل بنفس رقم الحوالة مسبقاً");
        }
        throw dbError;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث التحويل");
    }
  }

  // حذف تحويل
  static async deleteFundTransfer(transferId: string) {
    try {
      await storage.deleteFundTransfer(transferId);
      return { success: true, message: "تم حذف العهدة بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف التحويل");
    }
  }

  // ترحيل الأموال بين المشاريع
  static async getProjectFundTransfers_Inter(fromProjectId?: string, toProjectId?: string, date?: string) {
    try {
      const transfers = await storage.getProjectFundTransfers(fromProjectId, toProjectId, date);
      return { success: true, data: transfers };
    } catch (error) {
      throw new Error("خطأ في جلب عمليات ترحيل الأموال");
    }
  }

  // إنشاء ترحيل بين المشاريع
  static async createProjectFundTransfer(transferData: any) {
    try {
      const validation = insertProjectFundTransferSchema.safeParse(transferData);
      if (!validation.success) {
        throw new Error("بيانات عملية الترحيل غير صحيحة");
      }

      const transfer = await storage.createProjectFundTransfer(validation.data);
      return { success: true, data: transfer };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في إنشاء عملية الترحيل");
    }
  }

  // تحديث ترحيل بين المشاريع
  static async updateProjectFundTransfer(transferId: string, transferData: any) {
    try {
      const validation = insertProjectFundTransferSchema.partial().safeParse(transferData);
      if (!validation.success) {
        throw new Error("بيانات عملية الترحيل غير صحيحة");
      }

      const transfer = await storage.updateProjectFundTransfer(transferId, validation.data);
      if (!transfer) {
        throw new Error("عملية الترحيل غير موجودة");
      }
      
      return { success: true, data: transfer };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث عملية الترحيل");
    }
  }

  // حذف ترحيل بين المشاريع
  static async deleteProjectFundTransfer(transferId: string) {
    try {
      await storage.deleteProjectFundTransfer(transferId);
      return { success: true, message: "تم حذف عملية الترحيل بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف عملية الترحيل");
    }
  }
}