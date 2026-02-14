
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import ChatRoom from '@/lib/models/ChatRoom';
import User from '@/lib/models/User';

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
