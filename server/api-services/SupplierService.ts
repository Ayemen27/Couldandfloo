/**
 * خدمة الموردين - معالجة منطق الأعمال للموردين ومدفوعاتهم
 * يمكن استخدامها مع Express.js أو Next.js API Routes
 */
import { storage } from "../storage";
import { insertSupplierSchema, insertSupplierPaymentSchema } from "@shared/schema";

export class SupplierService {
  
  // جلب جميع الموردين
  static async getAllSuppliers() {
    try {
      const suppliers = await storage.getSuppliers();
      return { success: true, data: suppliers };
    } catch (error) {
      throw new Error("خطأ في جلب الموردين");
    }
  }

  // جلب مورد واحد
  static async getSupplierById(supplierId: string) {
    try {
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        throw new Error("المورد غير موجود");
      }
      return { success: true, data: supplier };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في جلب المورد");
    }
  }

  // إنشاء مورد جديد
  static async createSupplier(supplierData: any) {
    try {
      const validation = insertSupplierSchema.safeParse(supplierData);
      if (!validation.success) {
        throw new Error("بيانات المورد غير صحيحة");
      }

      const supplier = await storage.createSupplier(validation.data);
      return { success: true, data: supplier };
    } catch (error) {
      throw new Error("خطأ في إنشاء المورد");
    }
  }

  // تحديث مورد
  static async updateSupplier(supplierId: string, supplierData: any) {
    try {
      const validation = insertSupplierSchema.partial().safeParse(supplierData);
      if (!validation.success) {
        throw new Error("بيانات المورد غير صحيحة");
      }

      const supplier = await storage.updateSupplier(supplierId, validation.data);
      if (!supplier) {
        throw new Error("المورد غير موجود");
      }
      
      return { success: true, data: supplier };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث المورد");
    }
  }

  // حذف مورد
  static async deleteSupplier(supplierId: string) {
    try {
      await storage.deleteSupplier(supplierId);
      return { success: true, message: "تم حذف المورد بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف المورد");
    }
  }

  // مدفوعات المورد
  static async getSupplierPayments(supplierId: string) {
    try {
      const payments = await storage.getSupplierPayments(supplierId);
      return { success: true, data: payments };
    } catch (error) {
      throw new Error("خطأ في جلب مدفوعات المورد");
    }
  }

  // إنشاء دفعة جديدة
  static async createSupplierPayment(paymentData: any) {
    try {
      const validation = insertSupplierPaymentSchema.safeParse(paymentData);
      if (!validation.success) {
        throw new Error("بيانات الدفعة غير صحيحة");
      }

      const payment = await storage.createSupplierPayment(validation.data);
      return { success: true, data: payment };
    } catch (error) {
      throw new Error("خطأ في إنشاء الدفعة");
    }
  }

  // تحديث دفعة
  static async updateSupplierPayment(paymentId: string, paymentData: any) {
    try {
      const validation = insertSupplierPaymentSchema.partial().safeParse(paymentData);
      if (!validation.success) {
        throw new Error("بيانات الدفعة غير صحيحة");
      }

      const payment = await storage.updateSupplierPayment(paymentId, validation.data);
      if (!payment) {
        throw new Error("الدفعة غير موجودة");
      }
      
      return { success: true, data: payment };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث الدفعة");
    }
  }

  // حذف دفعة
  static async deleteSupplierPayment(paymentId: string) {
    try {
      await storage.deleteSupplierPayment(paymentId);
      return { success: true, message: "تم حذف الدفعة بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف الدفعة");
    }
  }

  // بيان حساب المورد
  static async getSupplierStatement(supplierId: string, dateFrom?: string, dateTo?: string) {
    try {
      // جلب المشتريات والمدفوعات للمورد في الفترة المحددة
      const purchases = await storage.getMaterialPurchasesWithFilters({ 
        supplierId, 
        dateFrom, 
        dateTo 
      });
      const payments = await storage.getSupplierPayments(supplierId);
      
      const statement = {
        supplierId,
        period: { from: dateFrom, to: dateTo },
        purchases,
        payments,
        totalPurchases: purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0),
        totalPayments: payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      };
      
      return { success: true, data: statement };
    } catch (error) {
      throw new Error("خطأ في جلب بيان حساب المورد");
    }
  }
}