#!/usr/bin/env tsx
/**
 * مولد الجسر الذكي - Vercel API Bridge Generator
 * الوصف: يقرأ routes.ts الموجود ويولد ملفات API متوافقة مع Vercel
 * المدخلات: server/routes.ts
 * المخرجات: ملفات api/[...]/route.ts متوافقة مع Vercel
 */

import * as fs from 'fs';
import * as path from 'path';

interface Route {
  method: string;
  path: string;
  handlerName: string;
  lineNumber: number;
}

class VercelAPIBridgeGenerator {
  private routes: Route[] = [];
  private routesContent: string = '';

  constructor() {
    console.log('🚀 بدء تحليل نظام المسارات الموجود...');
  }

  // قراءة وتحليل ملف routes.ts
  analyzeRoutesFile(): void {
    const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
    
    if (!fs.existsSync(routesPath)) {
      throw new Error('ملف server/routes.ts غير موجود!');
    }

    this.routesContent = fs.readFileSync(routesPath, 'utf-8');
    console.log('📖 تم قراءة ملف routes.ts بنجاح');
    
    this.extractRoutes();
  }

  // استخراج المسارات من الكود
  private extractRoutes(): void {
    const lines = this.routesContent.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // البحث عن مسارات Express
      const routeMatch = trimmedLine.match(/app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/);
      
      if (routeMatch) {
        const [, method, routePath] = routeMatch;
        
        // تنظيف المسار (إزالة /api/ من البداية)
        const cleanPath = routePath.replace(/^\/api\//, '');
        
        this.routes.push({
          method: method.toUpperCase(),
          path: cleanPath,
          handlerName: this.generateHandlerName(method, cleanPath),
          lineNumber: index + 1
        });
      }
    });

    console.log(`✅ تم استخراج ${this.routes.length} مسار من routes.ts`);
  }

  // إنشاء اسم دالة handler
  private generateHandlerName(method: string, path: string): string {
    const pathParts = path.split('/').filter(p => p && !p.startsWith(':'));
    return `handle${method.toUpperCase()}${pathParts.map(p => 
      p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, '')
    ).join('')}`;
  }

  // تنظيم المسارات في مجموعات
  private groupRoutesByPath(): Map<string, Route[]> {
    const groupedRoutes = new Map<string, Route[]>();

    this.routes.forEach(route => {
      // معالجة المسارات الديناميكية
      const normalizedPath = this.normalizePath(route.path);
      
      if (!groupedRoutes.has(normalizedPath)) {
        groupedRoutes.set(normalizedPath, []);
      }
      
      groupedRoutes.get(normalizedPath)!.push(route);
    });

    return groupedRoutes;
  }

  // تطبيع المسار لتجميع المسارات المشابهة
  private normalizePath(routePath: string): string {
    return routePath
      .replace(/\/:[^\/]+/g, '/[id]') // تحويل :id إلى [id]
      .replace(/\/:[^\/]+$/g, '/[id]') // تحويل :id في النهاية
      .replace(/\/$/, '') // إزالة الشرطة في النهاية
      || 'index'; // إذا كان المسار فارغ، استخدم index
  }

  // إنشاء محتوى ملف API
  private generateAPIFileContent(routes: Route[], filePath: string): string {
    const methods = routes.map(r => r.method).filter((m, i, arr) => arr.indexOf(m) === i);
    
    let content = `// Auto-generated Vercel API Bridge
// Generated from server/routes.ts
// Do not edit manually - this file is generated automatically

import { NextRequest, NextResponse } from 'next/server';
import { registerRoutes } from '@/server/routes';
import { createServer } from 'http';
import express from 'express';

// Create Express app instance for route handling
const createExpressHandler = async () => {
  const app = express();
  app.use(express.json());
  await registerRoutes(app);
  return app;
};

// Cache the Express app instance
let expressApp: express.Express | null = null;

const getExpressApp = async () => {
  if (!expressApp) {
    expressApp = await createExpressHandler();
  }
  return expressApp;
};

`;

    // إنشاء دوال التصدير لكل HTTP method
    methods.forEach(method => {
      const routesForMethod = routes.filter(r => r.method === method);
      
      content += `
export async function ${method}(request: NextRequest) {
  try {
    const app = await getExpressApp();
    const url = new URL(request.url);
    const apiPath = '/api/' + '${filePath.replace(/\[([^\]]+)\]/g, ':$1')}';
    
    // محاكاة Express request/response
    const mockReq = {
      method: '${method}',
      url: apiPath,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.json() : undefined,
      params: {},
      query: Object.fromEntries(url.searchParams.entries()),
    };

    return new Promise((resolve) => {
      const mockRes = {
        statusCode: 200,
        headers: {} as Record<string, string>,
        data: null as any,
        status: (code: number) => {
          mockRes.statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          mockRes.data = data;
          resolve(NextResponse.json(data, { 
            status: mockRes.statusCode,
            headers: mockRes.headers 
          }));
          return mockRes;
        },
        send: (data: any) => {
          mockRes.data = data;
          resolve(NextResponse.json(data, { 
            status: mockRes.statusCode,
            headers: mockRes.headers 
          }));
          return mockRes;
        },
        setHeader: (name: string, value: string) => {
          mockRes.headers[name] = value;
          return mockRes;
        }
      };

      // العثور على المعالج المناسب في routes.ts
      const handler = app._router.stack.find((layer: any) => {
        return layer.route && 
               layer.route.path === apiPath && 
               layer.route.methods['${method.toLowerCase()}'];
      });

      if (handler && handler.route) {
        handler.route.stack[0].handle(mockReq, mockRes);
      } else {
        resolve(NextResponse.json({ error: 'Route not found' }, { status: 404 }));
      }
    });
  } catch (error) {
    console.error('Error in ${method} handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}`;
    });

    return content;
  }

  // إنشاء الملفات
  generateAPIFiles(): void {
    const groupedRoutes = this.groupRoutesByPath();
    const apiDir = path.join(process.cwd(), 'api');

    // حذف المجلد القديم إذا كان موجوداً
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }

    // إنشاء مجلد api جديد
    fs.mkdirSync(apiDir, { recursive: true });

    let generatedFiles = 0;

    groupedRoutes.forEach((routes, normalizedPath) => {
      const filePath = normalizedPath === 'index' ? 'index' : normalizedPath;
      const fullPath = path.join(apiDir, ...filePath.split('/'), 'route.ts');
      
      // إنشاء المجلدات المطلوبة
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });

      // إنشاء محتوى الملف
      const content = this.generateAPIFileContent(routes, filePath);
      
      // كتابة الملف
      fs.writeFileSync(fullPath, content);
      generatedFiles++;

      console.log(`📝 تم إنشاء: api/${filePath}/route.ts`);
    });

    console.log(`✅ تم إنشاء ${generatedFiles} ملف API بنجاح!`);
  }

  // تحديث package.json scripts
  updatePackageScripts(): void {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'build:vercel': 'npm run generate:api && next build',
      'generate:api': 'tsx scripts/generate-vercel-api-bridge.ts',
      'dev:vercel': 'npm run generate:api && next dev'
    };

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('📦 تم تحديث package.json scripts');
  }

  // تشغيل العملية الكاملة
  run(): void {
    try {
      this.analyzeRoutesFile();
      this.generateAPIFiles();
      this.updatePackageScripts();
      
      console.log('\n🎉 تم إنشاء نظام الجسر الذكي بنجاح!');
      console.log('💡 يمكنك الآن نشر التطبيق على Vercel باستخدام:');
      console.log('   npm run build:vercel');
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء نظام الجسر:', error);
      process.exit(1);
    }
  }
}

// تشغيل المولد
if (require.main === module) {
  const generator = new VercelAPIBridgeGenerator();
  generator.run();
}

export { VercelAPIBridgeGenerator };