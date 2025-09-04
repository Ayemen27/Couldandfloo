import type { NextApiRequest, NextApiResponse } from 'next';
import express from 'express';
import { registerRoutes } from '../server/routes';

// إنشاء تطبيق Express مرة واحدة وإعادة استخدامه
let expressApp: express.Express | null = null;

async function getExpressApp(): Promise<express.Express> {
  if (!expressApp) {
    expressApp = express();
    expressApp.use(express.json());
    await registerRoutes(expressApp);
  }
  return expressApp;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const app = await getExpressApp();
    
    // بناء المسار الكامل للAPI
    const { slug } = req.query;
    const pathParts = Array.isArray(slug) ? slug : [slug];
    const apiPath = `/api/${pathParts.join('/')}`;
    
    console.log(`🔗 Routing request: ${req.method} ${apiPath}`);

    // إنشاء mock request و response لتمرير الطلب إلى Express
    const mockReq = {
      method: req.method,
      url: apiPath,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: {},
      originalUrl: apiPath,
      path: apiPath,
    } as any;

    // إنشاء mock response يلتقط الاستجابة من Express
    let responseData: any = null;
    let statusCode = 200;
    let responseHeaders: Record<string, string> = {};

    const mockRes = {
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
        responseHeaders[name] = value;
        return mockRes;
      },
      end: (data?: any) => {
        if (data !== undefined) {
          responseData = data;
        }
        return mockRes;
      }
    } as any;

    // البحث عن المعالج المناسب في Express router
    const router = app._router;
    let handled = false;

    for (const layer of router.stack) {
      if (layer.route) {
        const route = layer.route;
        const methodMatches = route.methods[req.method?.toLowerCase() || 'get'];
        const pathMatches = route.path === apiPath;
        
        if (methodMatches && pathMatches) {
          console.log(`✅ Found matching route: ${req.method} ${route.path}`);
          
          // تنفيذ المعالج
          await new Promise((resolve) => {
            const originalJson = mockRes.json;
            const originalSend = mockRes.send;
            const originalEnd = mockRes.end;
            
            mockRes.json = (data: any) => {
              responseData = data;
              resolve(data);
              return mockRes;
            };
            
            mockRes.send = (data: any) => {
              responseData = data;
              resolve(data);
              return mockRes;
            };
            
            mockRes.end = (data?: any) => {
              if (data !== undefined) {
                responseData = data;
              }
              resolve(responseData);
              return mockRes;
            };
            
            try {
              route.stack[0].handle(mockReq, mockRes, () => {
                resolve(null);
              });
            } catch (error) {
              console.error('Error in route handler:', error);
              resolve(null);
            }
          });
          
          handled = true;
          break;
        }
      }
    }

    if (!handled) {
      console.log(`❌ No matching route found for: ${req.method} ${apiPath}`);
      return res.status(404).json({ 
        error: 'Route not found',
        path: apiPath,
        method: req.method
      });
    }

    // إرسال الاستجابة
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.status(statusCode).json(responseData);
    
  } catch (error: any) {
    console.error('Error in API handler:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}