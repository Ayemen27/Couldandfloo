// Next.js API Route: GET/POST /api/workers
// تم إنشاؤه لتحويل Express routes إلى Next.js
import { NextRequest, NextResponse } from 'next/server';
import { WorkerService, handleApiError } from '../../../server/api-services/index';

export async function GET(request: NextRequest) {
  try {
    const result = await WorkerService.getAllWorkers();
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('خطأ في جلب العمال:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await WorkerService.createWorker(body);
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء العامل:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}