import { NextResponse, NextRequest } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import dbConnect from '@/lib/mongodb';
import CommonCode from '@/lib/models/CommonCode';

export const dynamic = 'force-dynamic';

async function handleGet(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Group parameter is required' },
        { status: 400 }
      );
    }

    const codes = await CommonCode.find({ group, isActive: true }).sort('order');

    return NextResponse.json({
      success: true,
      data: codes,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch common codes',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/common-codes');
