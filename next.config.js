/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات Next.js للتوافق مع نظام الملفات الحالي
  experimental: {
    appDir: true
  },
  
  // إعادة كتابة المسارات للتوافق مع Express API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ];
  },

  // إعدادات البناء
  typescript: {
    // السماح ببعض أخطاء TypeScript أثناء البناء لـ Vercel
    ignoreBuildErrors: process.env.NODE_ENV === 'production'
  },
  
  eslint: {
    // تجاهل أخطاء ESLint أثناء البناء
    ignoreDuringBuilds: true
  },

  // إعدادات الصور
  images: {
    unoptimized: true
  },

  // إعدادات التصدير للمواقع الثابتة (إذا لزم الأمر)
  output: process.env.VERCEL ? undefined : 'standalone',

  // متغيرات البيئة
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  }
};

module.exports = nextConfig;