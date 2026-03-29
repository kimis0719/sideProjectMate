import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiUsage extends Document {
  userId: Types.ObjectId;
  projectId: number; // pid
  boardId: Types.ObjectId;
  provider: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  createdAt: Date;
}

const AiUsageSchema = new Schema<IAiUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Number, required: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    provider: { type: String, required: true },
    modelName: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 쿨다운 체크: 사용자의 최근 사용 조회
AiUsageSchema.index({ userId: 1, createdAt: -1 });
// 일일 한도 체크: 프로젝트별 오늘 사용량
AiUsageSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.models.AiUsage || mongoose.model<IAiUsage>('AiUsage', AiUsageSchema);
