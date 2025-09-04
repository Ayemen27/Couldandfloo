/**
 * خدمة العمال - معالجة منطق الأعمال للعمال
 * يمكن استخدامها مع Express.js أو Next.js API Routes
 */
import { storage } from "../storage";
import { insertWorkerSchema, insertWorkerTypeSchema, insertWorkerAttendanceSchema } from "@shared/schema";

export class WorkerService {
  
  // جلب جميع العمال
  static async getAllWorkers() {
    try {
      const workers = await storage.getWorkers();
      return { success: true, data: workers };
    } catch (error) {
      throw new Error("خطأ في جلب العمال");
    }
  }

  // إنشاء عامل جديد
  static async createWorker(workerData: any) {
    try {
      const validation = insertWorkerSchema.safeParse(workerData);
      if (!validation.success) {
        throw new Error("بيانات العامل غير صحيحة");
      }

      // فحص عدم تكرار اسم العامل
      const existingWorker = await storage.getWorkerByName(validation.data.name);
      if (existingWorker) {
        throw new Error("يوجد عامل بنفس الاسم مسبقاً");
      }

      const worker = await storage.createWorker(validation.data);
      return { success: true, data: worker };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في إنشاء العامل");
    }
  }

  // تحديث عامل
  static async updateWorker(workerId: string, workerData: any) {
    try {
      const validation = insertWorkerSchema.safeParse(workerData);
      if (!validation.success) {
        throw new Error("بيانات العامل غير صحيحة");
      }

      const worker = await storage.updateWorker(workerId, validation.data);
      if (!worker) {
        throw new Error("العامل غير موجود");
      }
      
      return { success: true, data: worker };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث العامل");
    }
  }

  // حذف عامل
  static async deleteWorker(workerId: string) {
    try {
      await storage.deleteWorker(workerId);
      return { success: true, message: "تم حذف العامل بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف العامل");
    }
  }

  // أنواع العمال
  static async getAllWorkerTypes() {
    try {
      const workerTypes = await storage.getWorkerTypes();
      return { success: true, data: workerTypes };
    } catch (error) {
      throw new Error("خطأ في جلب أنواع العمال");
    }
  }

  // إنشاء نوع عامل جديد
  static async createWorkerType(workerTypeData: any) {
    try {
      const validation = insertWorkerTypeSchema.safeParse(workerTypeData);
      if (!validation.success) {
        throw new Error("بيانات نوع العامل غير صالحة");
      }

      const workerType = await storage.createWorkerType(validation.data);
      return { success: true, data: workerType };
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'worker_types_name_unique') {
        throw new Error("نوع العامل موجود مسبقاً");
      }
      throw new Error("خطأ في إضافة نوع العامل");
    }
  }

  // حضور العمال
  static async getWorkerAttendance(projectId: string, date: string) {
    try {
      const attendance = await storage.getWorkerAttendance(projectId, date);
      return { success: true, data: attendance };
    } catch (error) {
      throw new Error("خطأ في جلب حضور العمال");
    }
  }

  // إنشاء سجل حضور جديد
  static async createWorkerAttendance(attendanceData: any) {
    try {
      const validation = insertWorkerAttendanceSchema.safeParse(attendanceData);
      if (!validation.success) {
        throw new Error("بيانات الحضور غير صحيحة");
      }

      const attendance = await storage.createWorkerAttendance(validation.data);
      
      // تحديث الملخص اليومي بعد إضافة الحضور
      setImmediate(() => {
        storage.updateDailySummaryForDate(attendance.projectId, attendance.date)
          .catch(error => console.error("خطأ في تحديث الملخص اليومي:", error));
      });
      
      return { success: true, data: attendance };
    } catch (error) {
      throw new Error("حدث خطأ أثناء حفظ الحضور");
    }
  }

  // حذف سجل حضور
  static async deleteWorkerAttendance(attendanceId: string) {
    try {
      // الحصول على بيانات الحضور قبل حذفه لتحديث الملخص اليومي
      const attendance = await storage.getWorkerAttendanceById(attendanceId);
      
      await storage.deleteWorkerAttendance(attendanceId);
      
      // تحديث الملخص اليومي بعد حذف الحضور
      if (attendance) {
        setImmediate(() => {
          storage.updateDailySummaryForDate(attendance.projectId, attendance.date)
            .catch(error => console.error("خطأ في تحديث الملخص اليومي:", error));
        });
      }
      
      return { success: true, message: "تم حذف حضور العامل بنجاح" };
    } catch (error) {
      throw new Error("حدث خطأ أثناء حذف الحضور");
    }
  }
}