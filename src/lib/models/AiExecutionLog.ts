import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiExecutionLog extends Document {
  instructionId: Types.ObjectId;
  boardId: Types.ObjectId;
  executorId: Types.ObjectId;
  results: {
    noteId: Types.ObjectId;
    noteTitle: string;
    status: 'done' | 'partial' | 'failed';
    summary: string;
  }[];
  additionalNotes?: string;
  filesChanged: string[];
  testsResult?: 'pass' | 'fail' | 'skip';
  rawInput: string;
  parseMethod: 'json' | 'ai-fallback';
  createdAt: Date;
  updatedAt: Date;
}

const AiExecutionLogSchema = new Schema<IAiExecutionLog>(
  {
    instructionId: { type: Schema.Types.ObjectId, ref: 'AiInstructionHistory', required: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    executorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    results: [
      {
        noteId: { type: Schema.Types.ObjectId, ref: 'Note' },
        noteTitle: { type: String, default: '' },
        status: { type: String, enum: ['done', 'partial', 'failed'], required: true },
        summary: { type: String, default: '' },
      },
    ],
    additionalNotes: { type: String, default: '' },
    filesChanged: { type: [String], default: [] },
    testsResult: { type: String, enum: ['pass', 'fail', 'skip'] },
    rawInput: { type: String, required: true },
    parseMethod: { type: String, enum: ['json', 'ai-fallback'], required: true },
  },
  { timestamps: true }
);

AiExecutionLogSchema.index({ instructionId: 1 });
AiExecutionLogSchema.index({ boardId: 1, createdAt: -1 });

export default mongoose.models.AiExecutionLog ||
  mongoose.model<IAiExecutionLog>('AiExecutionLog', AiExecutionLogSchema);
