// Next.js API Route: GET/POST /api/projects
// تم إنشاؤه لتحويل Express routes إلى Next.js
import { NextRequest, NextResponse } from 'next/server';
import { ProjectService, handleApiError } from '../../../server/api-services/index';

export async function GET(request: NextRequest) {
  try {
    // تحديد نوع الطلب بناءً على query parameters
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('with-stats');
    
    let result;
    if (withStats === 'true') {
      result = await ProjectService.getProjectsWithStats();
    } else {
      result = await ProjectService.getAllProjects();
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('خطأ في جلب المشاريع:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await ProjectService.createProject(body);
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء المشروع:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}