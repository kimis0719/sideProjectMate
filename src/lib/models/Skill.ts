import mongoose, { Document, Schema } from 'mongoose';

/**
 * Skill 모델 인터페이스
 * 사용자가 보유한 기술 스택 정보를 저장합니다.
 */
export interface ISkill extends Document {
  userId: mongoose.Types.ObjectId; // 사용자 참조
  name: string; // 기술명 (예: React, Node.js)
  level: string; // 숙련도 (예: Beginner, Intermediate, Advanced, Pro)
  verified: boolean; // 검증 여부 (외부 연동 등)
  icon?: string; // 아이콘 URL (선택)
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // 검색 성능 향상을 위한 인덱스
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Pro'], // 숙련도 제한
      default: 'Beginner',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// 복합 인덱스: 한 유저가 같은 기술을 중복해서 등록하지 못하도록 방지
SkillSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);
