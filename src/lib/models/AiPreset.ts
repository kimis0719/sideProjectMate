import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiPreset extends Document {
  projectId: number; // pid — 프로젝트별 프리셋 (null이면 글로벌)
  name: string;
  roleInstruction: string;
  description: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AiPresetSchema = new Schema<IAiPreset>(
  {
    projectId: { type: Number, default: null, index: true },
    name: { type: String, required: true },
    roleInstruction: { type: String, required: true },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// 프로젝트별 프리셋 조회
AiPresetSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.models.AiPreset || mongoose.model<IAiPreset>('AiPreset', AiPresetSchema);
