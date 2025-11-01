import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
    try {
        await dbConnect();

        const users = await User.find({}).select('-password'); // 鍮꾨?踰덊샇 ?쒖쇅

        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();

        const body = await request.json();
        const user = await User.create(body);

        return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
