// Next.js API Route: GET/PUT/DELETE /api/projects/[id]
// تم إنشاؤه لتحويل Express routes إلى Next.js
import { NextRequest, NextResponse } from 'next/server';
import { ProjectService, handleApiError } from '../../../../server/api-services/index';

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await ProjectService.getProjectById(params.id);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error(`خطأ في جلب المشروع ${params.id}:`, error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const result = await ProjectService.updateProject(params.id, body);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error(`خطأ في تحديث المشروع ${params.id}:`, error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const result = await ProjectService.updateProject(params.id, body);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error(`خطأ في تحديث المشروع ${params.id}:`, error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await ProjectService.deleteProject(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`خطأ في حذف المشروع ${params.id}:`, error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}