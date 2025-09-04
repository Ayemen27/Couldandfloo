#!/usr/bin/env node
/**
 * مولد ملفات API لـ Vercel
 * يقرأ routes.ts ويولد ملفات api/ متوافقة مع Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 بدء إنشاء ملفات API لـ Vercel...');

// قراءة ملف routes.ts
const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
const routesContent = fs.readFileSync(routesPath, 'utf-8');

// استخراج جميع المسارات
const routePattern = /app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
const routes = [];

let match;
while ((match = routePattern.exec(routesContent)) !== null) {
  const [, method, fullPath] = match;
  const apiPath = fullPath.replace(/^\/api\//, '');
  routes.push({ method: method.toUpperCase(), path: apiPath });
}

console.log(`📊 تم العثور على ${routes.length} مسار`);

// تجميع المسارات حسب المسار الأساسي
const pathGroups = new Map();

routes.forEach(({ method, path }) => {
  const normalizedPath = path
    .replace(/\/:[^\/]+/g, '/[id]')
    .replace(/\/$/, '') || 'index';
  
  if (!pathGroups.has(normalizedPath)) {
    pathGroups.set(normalizedPath, new Set());
  }
  pathGroups.get(normalizedPath).add(method);
});

// حذف مجلد api القديم
const apiDir = path.join(process.cwd(), 'api');
if (fs.existsSync(apiDir)) {
  fs.rmSync(apiDir, { recursive: true });
}
fs.mkdirSync(apiDir, { recursive: true });

// إنشاء ملف جسر الاتصال الرئيسي
const bridgeContent = `// نظام الجسر بين Express و Vercel
import express from 'express';
import { registerRoutes } from '../server/routes';

let expressApp = null;

export async function getExpressApp() {
  if (!expressApp) {
    expressApp = express();
    expressApp.use(express.json());
    await registerRoutes(expressApp);
  }
  return expressApp;
}`;

fs.writeFileSync(path.join(apiDir, 'bridge.js'), bridgeContent);

// إنشاء ملف route.ts لكل مجموعة مسارات
let fileCount = 0;

pathGroups.forEach((methods, routePath) => {
  const pathParts = routePath === 'index' ? ['index'] : routePath.split('/');
  const filePath = path.join(apiDir, ...pathParts, 'route.js');
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const apiPath = routePath === 'index' ? '' : routePath;
  const fullApiPath = \`/api/\${apiPath}\`.replace(/\/+/g, '/').replace(/\/$/, '') || '/api';

  const content = \`// Auto-generated Vercel API route for \${fullApiPath}
import { NextResponse } from 'next/server';
import { getExpressApp } from '../bridge.js';

\${Array.from(methods).map(method => \`
export async function \${method}(request) {
  try {
    const app = await getExpressApp();
    const url = new URL(request.url);
    
    const body = request.method !== 'GET' ? await request.json().catch(() => ({})) : {};
    
    return new Promise((resolve) => {
      const mockReq = {
        method: '\${method}',
        url: '\${fullApiPath}',
        headers: Object.fromEntries(request.headers.entries()),
        body,
        params: {},
        query: Object.fromEntries(url.searchParams.entries()),
      };

      const mockRes = {
        statusCode: 200,
        headers: {},
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          resolve(NextResponse.json(data, { 
            status: this.statusCode,
            headers: this.headers
          }));
          return this;
        },
        send: function(data) {
          resolve(NextResponse.json(data, { 
            status: this.statusCode,
            headers: this.headers
          }));
          return this;
        },
        setHeader: function(name, value) {
          this.headers[name] = value;
          return this;
        }
      };

      // العثور على المعالج المناسب
      const router = app._router;
      let found = false;
      
      for (const layer of router.stack) {
        if (layer.route && 
            layer.route.path === '\${fullApiPath}' && 
            layer.route.methods['\${method.toLowerCase()}']) {
          layer.route.stack[0].handle(mockReq, mockRes, () => {});
          found = true;
          break;
        }
      }

      if (!found) {
        resolve(NextResponse.json({ error: 'Route not found' }, { status: 404 }));
      }
    });
  } catch (error) {
    console.error('Error in \${method} \${fullApiPath}:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}\`).join('\\n')}
\`;

  fs.writeFileSync(filePath, content);
  console.log(\`📝 تم إنشاء: api/\${pathParts.join('/')}/route.js\`);
  fileCount++;
});

console.log(\`✅ تم إنشاء \${fileCount} ملف API بنجاح!\`);
console.log('🎉 النظام جاهز للنشر على Vercel!');