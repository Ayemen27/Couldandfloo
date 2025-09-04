/**
 * خدمة المواد - معالجة منطق الأعمال للمواد ومشترياتها
 * يمكن استخدامها مع Express.js أو Next.js API Routes
 */
import { storage } from "../storage";
import { insertMaterialSchema, insertMaterialPurchaseSchema } from "@shared/schema";

export class MaterialService {
  
  // جلب جميع المواد
  static async getAllMaterials() {
    try {
      const materials = await storage.getMaterials();
      return { success: true, data: materials };
    } catch (error) {
      throw new Error("خطأ في جلب المواد");
    }
  }

  // إنشاء مادة جديدة
  static async createMaterial(materialData: any) {
    try {
      const validation = insertMaterialSchema.safeParse(materialData);
      if (!validation.success) {
        throw new Error("بيانات المادة غير صحيحة");
      }

      const material = await storage.createMaterial(validation.data);
      return { success: true, data: material };
    } catch (error) {
      throw new Error("خطأ في إنشاء المادة");
    }
  }

  // مشتريات المواد
  static async getProjectMaterialPurchases(projectId: string, date?: string) {
    try {
      const purchases = await storage.getMaterialPurchases(projectId, date);
      return { success: true, data: purchases };
    } catch (error) {
      throw new Error("خطأ في جلب مشتريات المواد");
    }
  }

  // إنشاء مشتريات مادة جديدة
  static async createMaterialPurchase(purchaseData: any) {
    try {
      const validation = insertMaterialPurchaseSchema.safeParse(purchaseData);
      if (!validation.success) {
        throw new Error("بيانات شراء المادة غير صحيحة");
      }

      const purchase = await storage.createMaterialPurchase(validation.data);
      
      // تحديث الملخص اليومي بعد إضافة الشراء
      setImmediate(() => {
        storage.updateDailySummaryForDate(purchase.projectId, purchase.purchaseDate)
          .catch(error => console.error("خطأ في تحديث الملخص اليومي:", error));
      });
      
      return { success: true, data: purchase };
    } catch (error) {
      throw new Error("خطأ في إنشاء شراء المادة");
    }
  }

  // تحديث شراء مادة
  static async updateMaterialPurchase(purchaseId: string, purchaseData: any) {
    try {
      const validation = insertMaterialPurchaseSchema.safeParse(purchaseData);
      if (!validation.success) {
        throw new Error("بيانات شراء المادة غير صحيحة");
      }

      const purchase = await storage.updateMaterialPurchase(purchaseId, validation.data);
      if (!purchase) {
        throw new Error("شراء المادة غير موجود");
      }
      
      return { success: true, data: purchase };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث شراء المادة");
    }
  }

  // حذف شراء مادة
  static async deleteMaterialPurchase(purchaseId: string) {
    try {
      await storage.deleteMaterialPurchase(purchaseId);
      return { success: true, message: "تم حذف شراء المادة بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف شراء المادة");
    }
  }
}