
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/lib/models/ChatRoom';
import ChatMessage from '@/lib/models/ChatMessage';
import User from '@/lib/models/User';

// Step 9.2: 내가 참여 중인 채팅방 목록 조회
// 최신 메시지(updatedAt) 기준 정렬하여 반환
export async function GET() {
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

        // 2. DB 연결 및 조회
        await dbConnect();

        // 3. 내가 participants 배열에 포함된 방만 조회, 최신 순 정렬
        const rooms = await ChatRoom.find({ participants: currentUserId })
            .sort({ updatedAt: -1 }) // 마지막 메시지 기준 최신 순
            .populate('participants', 'name nickname profileImage') // 참여자 정보 채우기
            .lean(); // 성능 최적화: 순수 JS 객체로 반환

        return NextResponse.json({ success: true, data: rooms });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: '채팅방 목록 조회 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}



export async function POST(request: Request) {
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

        // 2. 요청 데이터 파싱
        const body = await request.json();
        const { category, participants, metadata, projectId, applicationId } = body;

        // 3. 필수 필드 검증 - Category
        const validCategories = ['INQUIRY', 'RECRUIT', 'TEAM', 'DM', 'SYSTEM'];
        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, message: '유효하지 않은 채팅방 카테고리입니다.' },
                { status: 400 }
            );
        }

        // 4. 참여자 검증
        // participants 배열이 없으면 빈 배열로 초기화
        let uniqueParticipants = new Set<string>(participants || []);

        // SYSTEM 카테고리가 아니면 본인(생성자)을 필수 참여자로 추가
        // (SYSTEM은 봇이 생성하거나, 혹은 관리자가 생성할 수 있으므로 로직에 따라 다름.
        //  여기서는 일반 유저가 SYSTEM 방을 만들진 않는다고 가정하지만, 
        //  혹시 모를 에러 방지를 위해 본인을 포함하되 SYSTEM은 예외 처리 가능)
        if (category !== 'SYSTEM') {
            uniqueParticipants.add(currentUserId);
        }

        const participantList = Array.from(uniqueParticipants);

        // 최소 인원 검증 (SYSTEM 제외 2명 이상)
        if (category !== 'SYSTEM' && participantList.length < 2) {
            return NextResponse.json(
                { success: false, message: '대화 상대가 필요합니다. (최소 2명)' },
                { status: 400 }
            );
        }

        // 5. DB 연결
        await dbConnect();

        // 6. [중복 방지 로직 - 옵션]
        // DM(1:1)이나 TEAM, RECRUIT의 경우 이미 동일한 멤버 구성의 방이 있는지 체크할 수 있음.
        // 특히 DM은 보통 유니크해야 함.
        if (category === 'DM' && participantList.length === 2) {
            const existingRoom = await ChatRoom.findOne({
                category: 'DM',
                participants: { $all: participantList, $size: 2 }
            });

            if (existingRoom) {
                return NextResponse.json({
                    success: true,
                    message: '이미 존재하는 대화방을 불러옵니다.',
                    data: existingRoom
                });
            }
        }

        // 7. 채팅방 생성
        // participants가 실제 User DB에 존재하는지 검증하는 단계가 있으면 좋지만, 성능상 생략하거나 필요시 추가.

        const newRoom = await ChatRoom.create({
            category,
            participants: participantList,
            metadata: metadata || {},
            projectId: projectId || null,
            applicationId: applicationId || null,
            unreadCounts: {}, // 초기화
        });

        // 8. 🤖 [Step 4.2] 시스템 메시지(Bot) 자동 생성 로직
        // 방이 생성된 직후, 카테고리에 맞는 안내 메시지를 자동으로 뿌려준다!
        let systemMessageContent = '';
        switch (category) {
            case 'INQUIRY':
                systemMessageContent = '프로젝트에 대한 문의 대화방이 생성되었습니다. 궁금한 점을 편하게 남겨주세요!';
                break;
            case 'RECRUIT':
                systemMessageContent = '지원자 인터뷰를 위한 대화방입니다. 서로 예의를 갖추어 대화해주세요. 😊';
                break;
            case 'TEAM':
                systemMessageContent = '팀 매칭이 완료되어 공식 팀 채팅방이 생성되었습니다! 자유롭게 소통하며 멋진 프로젝트를 만들어보세요! 🚀';
                break;
            case 'SYSTEM':
                systemMessageContent = 'Side Project Mate 시스템 가이드 봇입니다. 무엇을 도와드릴까요?';
                break;
            // DM은 특별한 시스템 메시지 없이 시작
        }

        if (systemMessageContent) {
            await ChatMessage.create({
                roomId: newRoom._id,
                sender: currentUserId, // 시스템 메시지지만, 편의상 생성자를 sender로 두거나 어드민 봇 계정이 있다면 그 ID를 넣을 수 있음
                content: systemMessageContent,
                messageType: 'SYSTEM',
                readBy: [currentUserId],
            });

            // 🔥 방의 lastMessage 업데이트 (선택 사항)
            // ChatRoom 모델에 lastMessage 필드가 있다면 여기서 트리거 업데이트 해주는 게 좋아!
        }

        return NextResponse.json(
            { success: true, message: '채팅방이 생성되었습니다.', data: newRoom },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('[API ERROR: POST /api/chat/rooms]', error);
        return NextResponse.json(
            { success: false, message: '채팅방 생성 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
