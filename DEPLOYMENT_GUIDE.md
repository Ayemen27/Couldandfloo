# دليل النشر على Vercel - نظام إدارة المشاريع الإنشائية

## نظرة عامة

تم تحويل النظام من Express.js إلى Next.js API Routes ليكون متوافقاً مع Vercel. تم الاحتفاظ بجميع المنطق الأصلي من خلال طبقة خدمات منفصلة.

## الهيكل الجديد

```
├── app/api/                    # Next.js API Routes
│   ├── projects/
│   │   ├── route.ts           # GET/POST /api/projects
│   │   └── [id]/route.ts      # GET/PUT/DELETE /api/projects/:id
│   ├── workers/route.ts       # إدارة العمال
│   └── fund-transfers/route.ts # إدارة التحويلات
├── server/api-services/        # طبقة الخدمات (منطق الأعمال)
│   ├── ProjectService.ts      # خدمة المشاريع
│   ├── WorkerService.ts       # خدمة العمال
│   ├── FundTransferService.ts # خدمة التحويلات
│   ├── MaterialService.ts     # خدمة المواد
│   ├── SupplierService.ts     # خدمة الموردين
│   └── index.ts               # تصدير جميع الخدمات
├── scripts/generate-nextjs-routes.ts # سكربت تحويل المسارات
├── vercel.json                # إعدادات Vercel
├── next.config.js             # إعدادات Next.js
└── package.json.nextjs        # تبعيات Next.js
```

## خطوات النشر

### 1. إعداد المشروع الجديد

```bash
# إنشاء مجلد جديد للمشروع المحول
mkdir construction-nextjs
cd construction-nextjs

# نسخ الملفات الأساسية
cp -r server/ ./
cp -r shared/ ./
cp -r app/ ./
cp -r scripts/ ./
cp package.json.nextjs package.json
cp tsconfig.nextjs.json tsconfig.json
cp next.config.js ./
cp vercel.json ./
```

### 2. تثبيت التبعيات

```bash
npm install
```

### 3. إعداد متغيرات البيئة

إنشاء ملف `.env.local`:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

### 4. تشغيل المشروع محلياً

```bash
# للتطوير
npm run dev

# للبناء
npm run build

# للتشغيل في الإنتاج
npm start
```

### 5. النشر على Vercel

#### أ) من خلال Vercel CLI:

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel --prod
```

#### ب) من خلال واجهة Vercel:

1. ربط المشروع بـ GitHub
2. استيراد المشروع في Vercel
3. تعيين متغيرات البيئة في إعدادات Vercel
4. النشر

## تحويل المسارات تلقائياً

لإنشاء مسارات Next.js إضافية:

```bash
npm run convert-routes
```

سيقوم السكربت بتحليل `server/routes.ts` وإنشاء ملفات Next.js تلقائياً.

## الخدمات المتاحة

### ProjectService
- `getAllProjects()` - جلب جميع المشاريع
- `getProjectsWithStats()` - جلب المشاريع مع الإحصائيات  
- `getProjectById(id)` - جلب مشروع واحد
- `createProject(data)` - إنشاء مشروع جديد
- `updateProject(id, data)` - تحديث مشروع
- `deleteProject(id)` - حذف مشروع

### WorkerService
- `getAllWorkers()` - جلب جميع العمال
- `createWorker(data)` - إنشاء عامل جديد
- `updateWorker(id, data)` - تحديث عامل
- `deleteWorker(id)` - حذف عامل
- `getAllWorkerTypes()` - جلب أنواع العمال

### FundTransferService
- `getAllFundTransfers()` - جلب جميع التحويلات
- `getProjectFundTransfers(projectId, date)` - جلب تحويلات مشروع
- `createFundTransfer(data)` - إنشاء تحويل جديد

### MaterialService & SupplierService
- خدمات كاملة لإدارة المواد والموردين

## المميزات

✅ **لا حاجة لإعادة كتابة المنطق** - تم الاحتفاظ بجميع العمليات  
✅ **توافق مع Vercel** - يعمل على بيئة serverless  
✅ **مرونة في التطوير** - يمكن التبديل بين Express و Next.js  
✅ **سكربت تحويل تلقائي** - لتحويل مسارات إضافية  
✅ **نفس قاعدة البيانات** - متصل بـ Supabase الحالي  

## ملاحظات مهمة

1. **قاعدة البيانات**: لا تغيير في قاعدة البيانات أو الجداول
2. **منطق الأعمال**: محفوظ بالكامل في طبقة الخدمات
3. **التحقق من الأخطاء**: نفس نظام التحقق والتعامل مع الأخطاء
4. **الأمان**: نفس مستوى الحماية والتشفير

## المساعدة

للحصول على مساعدة إضافية أو تحويل مسارات معقدة، يمكنك:

1. تشغيل السكربت التلقائي لتحويل معظم المسارات
2. تعديل الخدمات حسب الحاجة
3. إضافة مسارات جديدة يدوياً باتباع النمط المطلوب

---

*تم إنشاء هذا النظام باستخدام أفضل الممارسات للحفاظ على الكود الأصلي مع ضمان التوافق مع بيئة Vercel.*