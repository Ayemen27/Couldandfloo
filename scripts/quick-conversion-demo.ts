/**
 * عرض سريع لكيفية عمل النظام المُحول
 * يختبر الخدمات الجديدة للتأكد من أنها تعمل
 */
import { ProjectService, WorkerService, FundTransferService } from '../server/api-services/index';

async function demoConvertedAPIs() {
  console.log('🚀 بدء اختبار الخدمات المُحولة...\n');

  try {
    // اختبار خدمة المشاريع
    console.log('1️⃣ اختبار ProjectService:');
    const projects = await ProjectService.getAllProjects();
    console.log(`✅ تم جلب ${projects.data?.length || 0} مشروع`);
    
    if (projects.data && projects.data.length > 0) {
      const firstProject = projects.data[0];
      console.log(`   📋 أول مشروع: ${firstProject.name}`);
      
      // اختبار جلب إحصائيات المشروع
      const stats = await ProjectService.getProjectStats(firstProject.id);
      console.log(`   📊 إجمالي الدخل: ${stats.data?.totalIncome || 0}`);
    }

    console.log();

    // اختبار خدمة العمال
    console.log('2️⃣ اختبار WorkerService:');
    const workers = await WorkerService.getAllWorkers();
    console.log(`✅ تم جلب ${workers.data?.length || 0} عامل`);
    
    const workerTypes = await WorkerService.getAllWorkerTypes();
    console.log(`✅ تم جلب ${workerTypes.data?.length || 0} نوع عامل`);

    console.log();

    // اختبار خدمة التحويلات
    console.log('3️⃣ اختبار FundTransferService:');
    const transfers = await FundTransferService.getAllFundTransfers();
    console.log(`✅ تم جلب ${transfers.data?.length || 0} تحويل مالي`);

    console.log();
    console.log('🎉 جميع الخدمات تعمل بنجاح!');
    console.log('✅ النظام جاهز للنشر على Vercel');

  } catch (error) {
    console.error('❌ خطأ في اختبار الخدمات:', error);
    throw error;
  }
}

// تشغيل العرض التوضيحي
if (require.main === module) {
  demoConvertedAPIs().catch(console.error);
}

export { demoConvertedAPIs };