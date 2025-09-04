/**
 * مسارات مبسطة للخادم - نسخة أساسية بدون الخدمات المتقدمة
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, insertWorkerSchema, insertFundTransferSchema, 
  insertWorkerAttendanceSchema, insertMaterialSchema, insertMaterialPurchaseSchema,
  insertTransportationExpenseSchema, insertDailyExpenseSummarySchema, insertWorkerTransferSchema,
  insertWorkerBalanceSchema, insertAutocompleteDataSchema, insertWorkerTypeSchema,
  insertWorkerMiscExpenseSchema, insertUserSchema, insertSupplierSchema, insertSupplierPaymentSchema,
  insertPrintSettingsSchema, insertProjectFundTransferSchema,
  insertReportTemplateSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ✅ مسارات المشاريع الأساسية
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('خطأ في جلب المشاريع:', error);
      res.status(500).json({ message: "خطأ في جلب المشاريع" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validation = insertProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const project = await storage.addProject(validation.data);
      res.status(201).json(project);
    } catch (error) {
      console.error('خطأ في إضافة المشروع:', error);
      res.status(500).json({ message: "خطأ في إضافة المشروع" });
    }
  });

  // ✅ مسارات العمال الأساسية
  app.get("/api/workers", async (req, res) => {
    try {
      const workers = await storage.getWorkers();
      res.json(workers);
    } catch (error) {
      console.error('خطأ في جلب العمال:', error);
      res.status(500).json({ message: "خطأ في جلب العمال" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const validation = insertWorkerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const worker = await storage.addWorker(validation.data);
      res.status(201).json(worker);
    } catch (error) {
      console.error('خطأ في إضافة العامل:', error);
      res.status(500).json({ message: "خطأ في إضافة العامل" });
    }
  });

  // ✅ مسارات الموردين الأساسية
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error('خطأ في جلب الموردين:', error);
      res.status(500).json({ message: "خطأ في جلب الموردين" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validation = insertSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: validation.error.errors });
      }
      const supplier = await storage.addSupplier(validation.data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      res.status(500).json({ message: "خطأ في إضافة المورد" });
    }
  });

  // ✅ مسار الحالة الأساسي
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "نشط", 
      message: "الخادم يعمل بشكل صحيح",
      timestamp: new Date().toISOString()
    });
  });

  const server = createServer(app);
  return server;
}