/**
 * سكربت تحويل Express Routes إلى Next.js API Routes
 * يقوم بتحليل server/routes.ts وإنشاء ملفات Next.js تلقائياً
 */
import * as fs from 'fs';
import * as path from 'path';

// قراءة ملف routes.ts وتحليل المسارات
function parseExpressRoutes(routesContent: string) {
  const routes = [];
  
  // تعبيرات منتظمة لاستخراج المسارات
  const routeRegex = /app\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
  
  let match;
  while ((match = routeRegex.exec(routesContent)) !== null) {
    const [, method, path] = match;
    routes.push({
      method: method.toUpperCase(),
      path: path,
      originalPath: path
    });
  }
  
  return routes;
}

// تحويل مسار Express إلى مسار Next.js
function convertPathToNextJS(expressPath: string) {
  // تحويل :param إلى [param]
  let nextPath = expressPath.replace(/\/api\//, '');
  nextPath = nextPath.replace(/:([^\/]+)/g, '[$1]');
  
  // تحويل * إلى [...slug]
  if (nextPath.includes('*')) {
    nextPath = nextPath.replace(/\*.*$/, '[...slug]');
  }
  
  return nextPath;
}

// إنشاء محتوى ملف Next.js API
function generateNextJSRoute(route: any, serviceMappings: any) {
  const { method, path } = route;
  const nextPath = convertPathToNextJS(path);
  
  // تحديد الخدمة المناسبة بناءً على المسار
  let serviceCall = getServiceCall(path, method);
  
  const template = `// تم إنشاء هذا الملف تلقائياً من Express Route: ${method} ${path}
import { NextRequest, NextResponse } from 'next/server';
${serviceCall.imports}

${method === 'GET' ? `
export async function GET(request: NextRequest${serviceCall.hasParams ? ', { params }' : ''}) {
  try {
    ${serviceCall.code}
    return NextResponse.json(result);
  } catch (error) {
    console.error('خطأ في ${path}:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'خطأ في الخادم' }, 
      { status: 500 }
    );
  }
}
` : ''}${method === 'POST' ? `
export async function POST(request: NextRequest${serviceCall.hasParams ? ', { params }' : ''}) {
  try {
    const body = await request.json();
    ${serviceCall.code}
    return NextResponse.json(result);
  } catch (error) {
    console.error('خطأ في ${path}:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'خطأ في الخادم' }, 
      { status: 500 }
    );
  }
}
` : ''}${method === 'PUT' ? `
export async function PUT(request: NextRequest${serviceCall.hasParams ? ', { params }' : ''}) {
  try {
    const body = await request.json();
    ${serviceCall.code}
    return NextResponse.json(result);
  } catch (error) {
    console.error('خطأ في ${path}:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'خطأ في الخادم' }, 
      { status: 500 }
    );
  }
}
` : ''}${method === 'DELETE' ? `
export async function DELETE(request: NextRequest${serviceCall.hasParams ? ', { params }' : ''}) {
  try {
    ${serviceCall.code}
    return NextResponse.json(result);
  } catch (error) {
    console.error('خطأ في ${path}:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'خطأ في الخادم' }, 
      { status: 500 }
    );
  }
}
` : ''}`;

  return template;
}

// تحديد استدعاء الخدمة المناسب
function getServiceCall(path: string, method: string) {
  // Projects
  if (path.includes('/projects') && !path.includes(':')) {
    if (method === 'GET') {
      if (path.includes('with-stats')) {
        return {
          imports: "import { ProjectService } from '@/server/api-services';",
          code: "const result = await ProjectService.getProjectsWithStats();",
          hasParams: false
        };
      }
      return {
        imports: "import { ProjectService } from '@/server/api-services';",
        code: "const result = await ProjectService.getAllProjects();",
        hasParams: false
      };
    }
    if (method === 'POST') {
      return {
        imports: "import { ProjectService } from '@/server/api-services';",
        code: "const result = await ProjectService.createProject(body);",
        hasParams: false
      };
    }
  }
  
  if (path.includes('/projects/:id')) {
    if (method === 'GET') {
      return {
        imports: "import { ProjectService } from '@/server/api-services';",
        code: "const result = await ProjectService.getProjectById(params.id);",
        hasParams: true
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      return {
        imports: "import { ProjectService } from '@/server/api-services';",
        code: "const result = await ProjectService.updateProject(params.id, body);",
        hasParams: true
      };
    }
    if (method === 'DELETE') {
      return {
        imports: "import { ProjectService } from '@/server/api-services';",
        code: "const result = await ProjectService.deleteProject(params.id);",
        hasParams: true
      };
    }
  }
  
  // Workers
  if (path.includes('/workers') && !path.includes(':')) {
    if (method === 'GET') {
      return {
        imports: "import { WorkerService } from '@/server/api-services';",
        code: "const result = await WorkerService.getAllWorkers();",
        hasParams: false
      };
    }
    if (method === 'POST') {
      return {
        imports: "import { WorkerService } from '@/server/api-services';",
        code: "const result = await WorkerService.createWorker(body);",
        hasParams: false
      };
    }
  }
  
  // Default fallback
  return {
    imports: "// تحتاج إلى تحديد الخدمة المناسبة للمسار: " + path,
    code: "// const result = await SomeService.someMethod();\\n    throw new Error('لم يتم تنفيذ هذا المسار بعد');",
    hasParams: path.includes(':')
  };
}

// دالة رئيسية للتحويل
async function convertExpressToNextJS() {
  try {
    console.log('🔄 بدء تحويل Express Routes إلى Next.js...');
    
    // قراءة ملف routes.ts
    const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    // تحليل المسارات
    const routes = parseExpressRoutes(routesContent);
    console.log(\`📋 تم العثور على \${routes.length} مسار\`);
    
    // إنشاء مجلد app/api إذا لم يكن موجوداً
    const apiDir = path.join(process.cwd(), 'app', 'api');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    
    let converted = 0;
    const skipList = ['/mobile*', '/api/health']; // مسارات يتم تجاهلها
    
    // تحويل كل مسار
    for (const route of routes) {
      if (skipList.some(skip => route.path.includes(skip.replace('*', '')))) {
        continue;
      }
      
      const nextPath = convertPathToNextJS(route.path);
      const routeDir = path.join(apiDir, path.dirname(nextPath));
      const routeFile = path.join(routeDir, 'route.ts');
      
      // إنشاء المجلد إذا لم يكن موجوداً
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      
      // تجنب الكتابة فوق الملفات الموجودة
      if (fs.existsSync(routeFile)) {
        continue;
      }
      
      // إنشاء محتوى الملف
      const routeContent = generateNextJSRoute(route, {});
      
      // كتابة الملف
      fs.writeFileSync(routeFile, routeContent, 'utf8');
      converted++;
      
      console.log(\`✅ تم تحويل: \${route.method} \${route.path} → app/api/\${nextPath}/route.ts\`);
    }
    
    console.log(\`🎉 تم تحويل \${converted} مسار بنجاح!\`);
    console.log('📝 ملاحظة: تحقق من الملفات المُنشأة وتأكد من استدعاءات الخدمات');
    
  } catch (error) {
    console.error('❌ خطأ في التحويل:', error);
    process.exit(1);
  }
}

// تشغيل السكربت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  convertExpressToNextJS();
}

export { convertExpressToNextJS };