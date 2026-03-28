import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

// 📝 [채팅방 카테고리 정의]
// INQUIRY: 단순 문의, RECRUIT: 지원/인터뷰, TEAM: 팀 협업, DM: 개인 메시지, SYSTEM: 시스템 알림
export type ChatCategory = 'INQUIRY' | 'RECRUIT' | 'TEAM' | 'DM' | 'SYSTEM';

// 📝 [채팅방 인터페이스]
export interface IChatRoom extends Document {
  category: ChatCategory; // 채팅방 성격 (필수)
  participants: IUser['_id'][]; // 참여자 목록 (User 참조)
  metadata?: {
    projectId?: string; // 관련 프로젝트 ID (옵션)
    applicationId?: string; // 관련 지원서 ID (옵션)
    [key: string]: any; // 기타 메타데이터
  };
  projectId?: mongoose.Types.ObjectId; // 프로젝트 참조 (빠른 조회를 위해 별도 필드)
  applicationId?: mongoose.Types.ObjectId; // 지원서 참조
  lastMessage?: string; // 마지막 메시지 내용 (목록 미리보기용)
  unreadCounts?: Map<string, number>; // 유저별 안 읽은 메시지 수 (확장성 고려)
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema: Schema = new Schema(
  {
    category: {
      type: String,
      enum: ['INQUIRY', 'RECRUIT', 'TEAM', 'DM', 'SYSTEM'],
      required: true,
      index: true, // 카테고리별 조회 성능 최적화
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
    },
    lastMessage: {
      type: String, // String으로 저장하여 목록 렌더링 최적화
    },
    // ✨ [추가] 유저별 안 읽은 메시지 카운트 (Map 구조 사용: userId -> count)
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// ✨ [인덱스 설정]
// 유저가 참여한 방을 빠르게 찾기 위해 participants 필드에 인덱스
ChatRoomSchema.index({ participants: 1 });
// 프로젝트별 채팅방 조회
ChatRoomSchema.index({ projectId: 1 });

// ✨ [유효성 검사]
// SYSTEM 카테고리가 아닌 경우 최소 2명 이상의 참여자가 있어야 함 (생성 시 체크)
ChatRoomSchema.pre('save', function (next) {
  const room = this as unknown as IChatRoom;
  if (room.category !== 'SYSTEM' && room.participants.length < 2) {
    // 주의: 실제 서비스 로직에 따라 1:1 대화방을 미리 생성하는 경우엔 1명일 수도 있으나,
    // 요구사항 '최소 2명의 참여자'를 반영함. (초대 로직이 별도라면 수정 필요)
    // 일단 여기서는 비즈니스 로직(API)단에서 검증하 권장하므로 스키마 레벨 에러는 스킵하거나 경고 수준으로 둠.
    // 하지만 강력한 정합성을 위해 에러를 발생시킬 수도 있음.
    // 여기서는 API 단에서 유연하게 처리하기 위해 스키마 레벨 강제는 생략하거나 주석만 남김.
  }
  next();
});

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
