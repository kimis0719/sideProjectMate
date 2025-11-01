import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
    try {
        await dbConnect();

        // DB 연결 상태 확인을 위한 기본 테스트
        const connection = await dbConnect();
        const dbState = connection.connection.readyState;

        const status = {
            mongodb: dbState === 1 ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, status });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message, mongodb: 'connection failed' },
            { status: 500 }
        );
    }
}
