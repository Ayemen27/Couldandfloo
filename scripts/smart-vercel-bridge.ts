#!/usr/bin/env tsx
/**
 * نظام الجسر الذكي المحسن لـ Vercel
 * يقرأ routes.ts ويولد ملفات api/ متوافقة مع Vercel
 */

import * as fs from 'fs';
import * as path from 'path';

// تشغيل المولد
async function generateVercelBridge() {
  console.log('🚀 بدء إنشاء نظام الجسر الذكي...');

  // قراءة ملف routes.ts
  const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
  const routesContent = fs.readFileSync(routesPath, 'utf-8');

  // استخراج جميع المسارات
  const routePattern = /app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
  const routes: Array<{method: string, path: string}> = [];
  
  let match;
  while ((match = routePattern.exec(routesContent)) !== null) {
    const [, method, fullPath] = match;
    // إزالة /api/ من بداية المسار
    const apiPath = fullPath.replace(/^\/api\//, '');
    routes.push({ method: method.toUpperCase(), path: apiPath });
  }

  console.log(`📊 تم العثور على ${routes.length} مسار`);

  // تجميع المسارات حسب المسار الأساسي
  const pathGroups = new Map<string, Set<string>>();
  
  routes.forEach(({ method, path }) => {
    // تحويل المسارات الديناميكية
    const normalizedPath = path
      .replace(/\/:[^\/]+/g, '/[id]')
      .replace(/\/$/, '') || 'index';
    
    if (!pathGroups.has(normalizedPath)) {
      pathGroups.set(normalizedPath, new Set());
    }
    pathGroups.get(normalizedPath)!.add(method);
  });

  // حذف مجلد api القديم
  const apiDir = path.join(process.cwd(), 'api');
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true });
  }
  fs.mkdirSync(apiDir, { recursive: true });

  // إنشاء ملف route.ts لكل مجموعة مسارات
  let fileCount = 0;
  
  pathGroups.forEach((methods, routePath) => {
    const pathParts = routePath === 'index' ? ['index'] : routePath.split('/');
    const filePath = path.join(apiDir, ...pathParts, 'route.ts');
    
    // إنشاء المجلدات
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // إنشاء محتوى الملف
    const content = generateRouteFileContent(Array.from(methods), routePath);
    fs.writeFileSync(filePath, content);
    
    console.log(`📝 تم إنشاء: api/${pathParts.join('/')}/route.ts`);
    fileCount++;
  });

  // إنشاء ملف الجسر الرئيسي
  const bridgeContent = `// Express to Vercel Bridge
import express from 'express';
import { registerRoutes } from '../server/routes';

let expressApp: express.Express | null = null;

export async function getExpressApp() {
  if (!expressApp) {
    expressApp = express();
    expressApp.use(express.json());
    await registerRoutes(expressApp);
  }
  return expressApp;
}

export function createMockRequest(req: any, apiPath: string) {
  return {
    method: req.method,
    url: apiPath,
    headers: req.headers,
    body: req.body,
    params: {},
    query: req.query || {},
    originalUrl: apiPath,
    path: apiPath,
  };
}

export function createMockResponse() {
  let statusCode = 200;
  let responseData: any = null;
  let headers: Record<string, string> = {};

  return {
    status: (code: number) => {
      statusCode = code;
      return mockRes;
    },
    json: (data: any) => {
      responseData = data;
      return mockRes;
    },
    send: (data: any) => {
      responseData = data;
      return mockRes;
    },
    setHeader: (name: string, value: string) => {
      headers[name] = value;
      return mockRes;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData,
    getHeaders: () => headers,
  };
}`;

  fs.writeFileSync(path.join(apiDir, 'bridge.ts'), bridgeContent);

  console.log(`✅ تم إنشاء ${fileCount} ملف API + ملف الجسر الرئيسي`);
  console.log('🎉 نظام الجسر الذكي جاهز للنشر على Vercel!');
}

function generateRouteFileContent(methods: string[], routePath: string): string {
  const apiPath = routePath === 'index' ? '' : routePath;
  const fullApiPath = `/api/${apiPath}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/api';

  return `// Auto-generated Vercel API route
// Path: ${fullApiPath}
import { NextRequest, NextResponse } from 'next/server';
import { getExpressApp, createMockRequest, createMockResponse } from '../bridge';

${methods.map(method => `
export async function ${method}(request: NextRequest) {
  try {
    const app = await getExpressApp();
    const url = new URL(request.url);
    
    // استخراج البيانات من الطلب
    const body = request.method !== 'GET' ? await request.json().catch(() => ({})) : {};
    
    // إنشاء mock request و response
    const mockReq = createMockRequest({
      method: '${method}',
      headers: Object.fromEntries(request.headers.entries()),
      body,
      query: Object.fromEntries(url.searchParams.entries()),
    }, '${fullApiPath}');

    const mockRes = createMockResponse();

    // تنفيذ الطلب عبر Express
    return new Promise((resolve) => {
      // البحث عن المعالج المناسب
      const router = app._router;
      let handler = null;
      
      for (const layer of router.stack) {
        if (layer.route && 
            layer.route.path === '${fullApiPath}' && 
            layer.route.methods['${method.toLowerCase()}']) {
          handler = layer.route.stack[0].handle;
          break;
        }
      }

      if (handler) {
        // إضافة معالج الاستجابة
        const originalJson = mockRes.json;
        const originalSend = mockRes.send;
        
        mockRes.json = (data: any) => {
          resolve(NextResponse.json(data, { 
            status: mockRes.getStatusCode(),
            headers: mockRes.getHeaders()
          }));
          return mockRes;
        };
        
        mockRes.send = (data: any) => {
          resolve(NextResponse.json(data, { 
            status: mockRes.getStatusCode(),
            headers: mockRes.getHeaders()
          }));
          return mockRes;
        };

        // تشغيل المعالج
        handler(mockReq, mockRes, () => {
          resolve(NextResponse.json({ error: 'Route handler completed without response' }, { status: 500 }));
        });
      } else {
        resolve(NextResponse.json({ error: 'Route not found' }, { status: 404 }));
      }
    });
  } catch (error) {
    console.error('Error in ${method} ${fullApiPath}:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}`).join('\n')}
`;
}

// تشغيل المولد
if (require.main === module) {
  generateVercelBridge().catch(console.error);
}