import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChatMessage from '@/lib/models/ChatMessage';
import mongoose from 'mongoose';

export async function GET(
    req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        await dbConnect();
        const { roomId } = params;

        // URL 쿼리 파라미터에서 페이지네이션 정보 추출 (Step 8.1 대비)
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        // 💡 탭마다 다르게 생성되는 프론트엔드의 가짜 유저 ID 가져오기 (실제론 Token/Session 사용)
        const currentUserId = searchParams.get('userId');

        // 📜 [Step 8.1] 무한 스크롤용 커서 (가장 오래된 메시지의 ID)
        const cursor = searchParams.get('cursor');

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return NextResponse.json({ success: false, message: '유효하지 않은 채팅방 ID입니다.' }, { status: 400 });
        }

        // 1. 해당 방의 메시지 내역을 DB에서 조회 (최신순 정렬)
        let query: any = { roomId };

        // 📜 [Step 8.1] 커서가 존재하면, 그 커서(메시지 ID)보다 "더 옛날에" 만들어진 메시지만 검색
        if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
            query._id = { $lt: cursor };
        }

        // 다음 페이지가 있는지 확인하기 위해 limit보다 1개 더 많이 가져옴
        const messages = await ChatMessage.find(query)
            .sort({ createdAt: -1 }) // 가장 최신 메시지부터
            .limit(limit + 1)
            .lean(); // POJO 빙환으로 성능 최적화

        // 📜 [Step 8.1] 다음 페이지 존재 여부 계산
        const hasNextPage = messages.length > limit;
        if (hasNextPage) {
            messages.pop(); // 초과해서 가져온 1개는 클라이언트에 안 보내고 빼버림
        }

        // 다음 번에 요청할 때 쓸 커서 (이번에 보낼 데이터 중 가장 마지막(가장 오래된) 메시지의 ID)
        const nextCursor = messages.length > 0 ? messages[messages.length - 1]._id : null;

        // 2. [Step 7.2] 안 읽은 메시지 일괄 읽음 처리 (Read Receipt)
        // 내가 '보낸 사람(sender)'이 아니고, '읽은 사람(readBy)'에 내 ID가 아직 없는 메시지들을 찾아서 업데이트
        if (currentUserId) {
            await ChatMessage.updateMany(
                {
                    roomId,
                    sender: { $ne: currentUserId }, // 내가 보낸 게 아닌 것 중에서
                    readBy: { $ne: currentUserId }  // 아직 내가 안 읽은 것들
                },
                {
                    $addToSet: { readBy: currentUserId } // 내 ID를 배열에 중복 없이 쏙 추가!
                }
            );
        }

        // 배열 순서를 다시 과거 -> 최신(보여질 순서)으로 뒤집기
        messages.reverse();

        return NextResponse.json({
            success: true,
            data: messages,
            // 📜 [Step 8.1] 프론트엔드가 무한스크롤을 이어갈 수 있게 상태값 전달
            pagination: {
                nextCursor,
                hasNextPage
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch messages error:', error);
        return NextResponse.json(
            { success: false, message: '메시지 내역을 불러오지 못했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
