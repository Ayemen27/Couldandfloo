/**
 * خادم مبسط للغاية - فقط للتشغيل الأساسي
 */
import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// إعداد CORS للسماح بالطلبات من الواجهة الأمامية
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

const server = createServer(app);

// إعداد Vite للتطوير أو الملفات الثابتة للإنتاج
(async () => {
  // مسارات أساسية للتطبيق - يجب تسجيلها قبل static serving
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "نشط", 
      message: "الخادم يعمل بشكل صحيح",
      timestamp: new Date().toISOString()
    });
  });

  // مسارات أساسية مؤقتة للمشاريع والعمال والموردين
  app.get("/api/projects", (req, res) => {
    res.json([]);
  });

  app.get("/api/projects/with-stats", (req, res) => {
    res.json([]);
  });

  app.get("/api/workers", (req, res) => {
    res.json([]);
  });

  app.get("/api/suppliers", (req, res) => {
    res.json([]);
  });

  app.get("/api/autocomplete-data", (req, res) => {
    res.json([]);
  });

  app.get("/api/notifications", (req, res) => {
    res.json([]);
  });

  app.get("/api/statistics/general", (req, res) => {
    res.json({
      totalProjects: 0,
      totalWorkers: 0,
      totalSuppliers: 0,
      totalRevenue: 0
    });
  });

  // مسار لإعدادات التطبيق
  app.get("/api/config", (req, res) => {
    res.json({
      appName: "نظام إدارة المشاريع الإنشائية",
      version: "1.0.0",
      language: "ar"
    });
  });

  // APIs مصادقة مبسطة للسماح بتشغيل التطبيق
  app.post("/api/auth/login", (req, res) => {
    // مصادقة مبسطة مؤقتة
    res.json({
      success: true,
      user: {
        id: "user1",
        email: req.body.email || "admin@example.com",
        name: "مستخدم تجريبي",
        role: "admin"
      },
      tokens: {
        accessToken: "simple-access-token",
        refreshToken: "simple-refresh-token"
      },
      message: "تم تسجيل الدخول بنجاح"
    });
  });

  app.post("/api/auth/register", (req, res) => {
    res.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      user: {
        id: "user1",
        email: req.body.email,
        name: req.body.name,
        role: "user"
      }
    });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({
      user: {
        id: "user1",
        email: "admin@example.com",
        name: "مستخدم تجريبي",
        role: "admin"
      }
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // معالج للمسارات API غير الموجودة
    app.use('/api/*', (req, res) => {
      res.status(404).json({ message: `API endpoint not found: ${req.path}` });
    });
    serveStatic(app);
  }

  // تشغيل الخادم
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 الخادم المبسط يعمل على المنفذ ${port}`);
  });
})();