// Next.js API Route: GET/POST /api/fund-transfers
// تم إنشاؤه لتحويل Express routes إلى Next.js
import { NextRequest, NextResponse } from 'next/server';
import { FundTransferService, handleApiError } from '../../../server/api-services/index';

export async function GET(request: NextRequest) {
  try {
    const result = await FundTransferService.getAllFundTransfers();
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('خطأ في جلب التحويلات:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await FundTransferService.createFundTransfer(body);
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء التحويل:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}