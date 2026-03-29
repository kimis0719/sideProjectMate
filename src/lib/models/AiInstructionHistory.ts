import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiInstructionHistory extends Document {
  projectId: number; // pid
  boardId: Types.ObjectId;
  creatorId: Types.ObjectId;
  preset: string; // 사용한 프리셋 이름
  target: {
    type: 'all' | 'sections' | 'notes';
    sectionIds?: Types.ObjectId[];
    noteIds?: Types.ObjectId[];
  };
  reference?: {
    sectionIds?: Types.ObjectId[];
    noteIds?: Types.ObjectId[];
  };
  additionalInstruction?: string;
  resultMarkdown: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  modelName: string;
  createdAt: Date;
}

const AiInstructionHistorySchema = new Schema<IAiInstructionHistory>(
  {
    projectId: { type: Number, required: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    preset: { type: String, default: '' },
    target: {
      type: {
        type: String,
        enum: ['all', 'sections', 'notes'],
        required: true,
      },
      sectionIds: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
      noteIds: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    },
    reference: {
      sectionIds: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
      noteIds: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    },
    additionalInstruction: { type: String, default: '' },
    resultMarkdown: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    provider: { type: String, required: true },
    modelName: { type: String, required: true },
  },
  { timestamps: true }
);

// 보드별 히스토리 최신순
AiInstructionHistorySchema.index({ boardId: 1, createdAt: -1 });
// 프로젝트별 히스토리
AiInstructionHistorySchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.models.AiInstructionHistory ||
  mongoose.model<IAiInstructionHistory>('AiInstructionHistory', AiInstructionHistorySchema);
