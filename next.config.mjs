import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات للتوافق مع Vercel
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  
  // إعدادات البناء للإنتاج
  typescript: {
    ignoreBuildErrors: true
  },
  
  eslint: {
    ignoreDuringBuilds: true
  },

  // إعدادات الصور
  images: {
    unoptimized: true
  },

  // إعدادات webpack للتوافق مع dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pg-native');
    }
    
    // إضافة alias للمجلدات
    config.resolve.alias['@'] = path.resolve(__dirname);
    config.resolve.alias['@shared'] = path.resolve(__dirname, 'shared');
    config.resolve.alias['@server'] = path.resolve(__dirname, 'server');
    
    return config;
  },

  // متغيرات البيئة العامة
  env: {
    CUSTOM_KEY: 'construction_management_system'
  },

  // إعدادات المسارات
  trailingSlash: false,
  
  // إعدادات التصدير
  output: 'standalone'
};

export default nextConfig;