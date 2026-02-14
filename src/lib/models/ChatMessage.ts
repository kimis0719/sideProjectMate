
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IChatRoom } from './ChatRoom';

// 📝 [채팅 메시지 인터페이스]
export interface IChatMessage extends Document {
    roomId: IChatRoom['_id']; // 소속 채팅방 ID
    sender: IUser['_id']; // 보낸 사람 ID
    content: string; // 메시지 내용
    readBy: IUser['_id'][]; // 읽은 사람 목록 (1:N 채팅 읽음 처리용)
    messageType: 'TEXT' | 'IMAGE' | 'SYSTEM'; // 메시지 타입 (확장성)
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
    {
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'ChatRoom',
            required: true,
            index: true, // 특정 채팅방의 메시지 로딩 속도 향상
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        messageType: {
            type: String,
            enum: ['TEXT', 'IMAGE', 'SYSTEM'],
            default: 'TEXT',
        },
    },
    {
        timestamps: true, // createdAt 사용
    }
);

// ✨ [인덱스 설정]
// 채팅방별 메시지를 시간순(최신순/과거순)으로 빠르게 가져오기 위함
ChatMessageSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
