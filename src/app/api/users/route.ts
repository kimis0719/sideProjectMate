import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withApiLogging } from '@/lib/apiLogger';

async function handleGet() {
  try {
    await dbConnect();

    const users = await User.find({}).select('-password').lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const user = await User.create(body);

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/users');
export const POST = withApiLogging(handlePost, '/api/users');
