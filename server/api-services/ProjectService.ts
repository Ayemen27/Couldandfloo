/**
 * خدمة المشاريع - معالجة منطق الأعمال للمشاريع
 * يمكن استخدامها مع Express.js أو Next.js API Routes
 */
import { storage } from "../storage";
import { insertProjectSchema } from "@shared/schema";
import type { Request, Response } from "express";

export class ProjectService {
  
  // جلب جميع المشاريع
  static async getAllProjects(req?: Request) {
    try {
      const projects = await storage.getProjects();
      return { success: true, data: projects };
    } catch (error) {
      throw new Error("خطأ في جلب المشاريع");
    }
  }

  // جلب المشاريع مع الإحصائيات
  static async getProjectsWithStats(req?: Request) {
    try {
      // استخدام وظيفة متوفرة بدلاً من getProjectsWithStats
      const projects = await storage.getProjects();
      const projectsWithStats = [];
      
      for (const project of projects) {
        const stats = await storage.getProjectStatistics(project.id);
        projectsWithStats.push({
          ...project,
          ...stats
        });
      }
      
      return { success: true, data: projectsWithStats };
    } catch (error) {
      throw new Error("خطأ في جلب إحصائيات المشاريع");
    }
  }

  // جلب مشروع واحد
  static async getProjectById(projectId: string) {
    try {
      const project = await storage.getProject(projectId);
      if (!project) {
        throw new Error("المشروع غير موجود");
      }
      return { success: true, data: project };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في جلب المشروع");
    }
  }

  // إنشاء مشروع جديد
  static async createProject(projectData: any) {
    try {
      const validation = insertProjectSchema.safeParse(projectData);
      if (!validation.success) {
        throw new Error("بيانات المشروع غير صحيحة");
      }

      const project = await storage.createProject(validation.data);
      return { success: true, data: project };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في إنشاء المشروع");
    }
  }

  // تحديث مشروع
  static async updateProject(projectId: string, projectData: any) {
    try {
      const validation = insertProjectSchema.partial().safeParse(projectData);
      if (!validation.success) {
        throw new Error("بيانات المشروع غير صحيحة");
      }

      const project = await storage.updateProject(projectId, validation.data);
      if (!project) {
        throw new Error("المشروع غير موجود");
      }
      
      return { success: true, data: project };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "خطأ في تحديث المشروع");
    }
  }

  // حذف مشروع
  static async deleteProject(projectId: string) {
    try {
      await storage.deleteProject(projectId);
      return { success: true, message: "تم حذف المشروع بنجاح" };
    } catch (error) {
      throw new Error("خطأ في حذف المشروع");
    }
  }

  // إحصائيات مشروع
  static async getProjectStats(projectId: string) {
    try {
      const stats = await storage.getProjectStatistics(projectId);
      return { success: true, data: stats };
    } catch (error) {
      throw new Error("خطأ في جلب إحصائيات المشروع");
    }
  }

  // التحليل المالي للمشروع
  static async getProjectFinancialAnalysis(projectId: string, dateFrom?: string, dateTo?: string) {
    try {
      // استخدام الإحصائيات المتوفرة
      const stats = await storage.getProjectStatistics(projectId);
      const analysis = {
        projectId,
        dateRange: { from: dateFrom, to: dateTo },
        ...stats
      };
      
      return { success: true, data: analysis };
    } catch (error) {
      throw new Error("خطأ في جلب التحليل المالي");
    }
  }
}