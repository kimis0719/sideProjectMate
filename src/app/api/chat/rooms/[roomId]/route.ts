
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/lib/models/ChatRoom';

// Step 9.4: 채팅방 나가기
// - 참여자 배열에서 현재 사용자 제거
// - 참여자가 0명이 되면 채팅방 자체를 삭제
export async function DELETE(
    _request: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        // 1. 인증 확인
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json(
                { success: false, message: '로그인이 필요한 서비스입니다.' },
                { status: 401 }
            );
        }
        const currentUserId = session.user._id;
        const { roomId } = params;

        // 2. DB 연결
        await dbConnect();

        // 3. 대상 채팅방 조회
        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return NextResponse.json(
                { success: false, message: '채팅방을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 4. 내가 이 방의 참여자인지 확인
        const isParticipant = room.participants.some(
            (p: any) => p.toString() === currentUserId
        );
        if (!isParticipant) {
            return NextResponse.json(
                { success: false, message: '해당 채팅방의 참여자가 아닙니다.' },
                { status: 403 }
            );
        }

        // 5. 참여자 배열에서 현재 사용자 제거
        room.participants = room.participants.filter(
            (p: any) => p.toString() !== currentUserId
        );

        if (room.participants.length === 0) {
            // 6a. 참여자가 0명이 되면 방 자체 삭제
            await ChatRoom.findByIdAndDelete(roomId);
            return NextResponse.json({
                success: true,
                message: '채팅방이 삭제되었습니다.',
                data: { deleted: true }
            });
        } else {
            // 6b. 아직 참여자가 남아 있으면 방 유지 (나만 나감)
            await room.save();
            return NextResponse.json({
                success: true,
                message: '채팅방에서 나갔습니다.',
                data: { deleted: false }
            });
        }

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: '채팅방 나가기 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
