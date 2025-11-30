import mongoose, { Document, Schema } from 'mongoose';

/**
 * Availability 모델 인터페이스
 * 사용자의 주간 가용 시간과 커뮤니케이션 성향을 저장합니다.
 * schedule 필드는 availability-scheduler 라이브러리의 표준 포맷을 따릅니다.
 */
export interface IAvailability extends Document {
    userId: mongoose.Types.ObjectId;
    schedule: Array<{
        day: string; // 요일 (예: 'monday', 'tuesday'...)
        timeRanges: Array<{
            start: string; // 시작 시간 (예: '09:00')
            end: string;   // 종료 시간 (예: '12:00')
        }>;
    }>;
    preference: number; // 0(완전 비동기) ~ 100(완전 동기)
    personalityTags: string[]; // 성향 태그 (예: 'analyst', 'doer')
    createdAt: Date;
    updatedAt: Date;
}

const AvailabilitySchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // 유저당 하나의 가용성 정보만 존재
        },
        // availability-scheduler 호환 JSON 구조
        schedule: [
            {
                day: {
                    type: String,
                    required: true,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                },
                timeRanges: [
                    {
                        start: { type: String, required: true },
                        end: { type: String, required: true },
                    },
                ],
            },
        ],
        preference: {
            type: Number,
            min: 0,
            max: 100,
            default: 50, // 기본값: 중간
        },
        personalityTags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);
