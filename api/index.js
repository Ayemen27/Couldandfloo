// Vercel Serverless Function - Entry Point
const express = require('express');
const path = require('path');
const { createServer } = require('http');

// استيراد التطبيق الرئيسي
let app;

try {
  // محاولة استيراد التطبيق المبني
  const serverModule = require('../dist/index.js');
  
  // إذا كان الملف يحتوي على تطبيق Express
  if (serverModule && typeof serverModule.default === 'function') {
    app = serverModule.default;
  } else if (serverModule && serverModule.app) {
    app = serverModule.app;
  } else {
    // إنشاء تطبيق Express بسيط
    app = express();
    
    // خدمة الملفات الثابتة
    const publicPath = path.join(__dirname, '..', 'dist', 'public');
    app.use(express.static(publicPath));
    
    // مسار افتراضي
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }
} catch (error) {
  console.error('خطأ في تحميل التطبيق:', error);
  
  // إنشاء تطبيق طوارئ
  app = express();
  app.get('*', (req, res) => {
    res.status(500).json({
      message: 'خطأ في تحميل التطبيق',
      error: error.message
    });
  });
}

// تصدير التطبيق لـ Vercel
module.exports = app;