#!/bin/bash

# تشغيل تطبيق الموبايل (Mobile App Startup Script)
echo "🚀 بدء تشغيل تطبيق إدارة المشاريع الإنشائية الموبايل..."

# التنقل إلى مجلد التطبيق
cd mobile-app

# فحص وجود node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت التبعيات..."
    npm install --legacy-peer-deps
fi

# تثبيت Expo CLI إذا لم يكن مثبت
if ! command -v expo &> /dev/null; then
    echo "⚡ تثبيت Expo CLI..."
    npm install -g @expo/cli
fi

echo "✅ جميع التبعيات جاهزة"
echo "🌍 بدء تشغيل الخادم على المنفذ 19006"
echo "📱 يمكنك الوصول للتطبيق على: http://localhost:19006"

# تشغيل التطبيق
npm start