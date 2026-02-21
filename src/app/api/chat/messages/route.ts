import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChatMessage from '@/lib/models/ChatMessage';
import ChatRoom from '@/lib/models/ChatRoom';

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        const { roomId, content, messageType = 'TEXT', senderId } = body;

        // 💡 프론트엔드에서 넘어온 임시 ID 사용 (추후 NextAuth session으로 대체)
        const currentUserId = senderId || '65f0a1b2c3d4e5f6a1b2c3d9';

        if (!roomId || !content) {
            return NextResponse.json(
                { success: false, message: '채팅방 ID와 메시지 내용은 필수입니다.' },
                { status: 400 }
            );
        }

        // 1. 메시지 생성 및 저장
        const newMessage = await ChatMessage.create({
            roomId,
            sender: currentUserId,
            content,
            messageType,
            readBy: [currentUserId], // 보낸 사람은 기본적으로 읽음 처리
        });

        // 2. 해당 채팅방(ChatRoom)의 lastMessage 필드 업데이트
        await ChatRoom.findByIdAndUpdate(roomId, {
            lastMessage: content,
            updatedAt: new Date()
        });

        return NextResponse.json(
            { success: true, message: '메시지가 성공적으로 저장되었습니다.', data: newMessage },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Save message error:', error);
        return NextResponse.json(
            { success: false, message: '메시지 저장 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
