import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
    boardId: mongoose.Types.ObjectId;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    zIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
    {
        boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
        title: { type: String, required: true, default: 'New Section' },
        x: { type: Number, required: true, default: 0 },
        y: { type: Number, required: true, default: 0 },
        width: { type: Number, required: true, default: 300 },
        height: { type: Number, required: true, default: 300 },
        color: { type: String, default: '#E5E7EB' }, // Default gray
        zIndex: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// 인덱스: 보드별 조회 성능 향상
SectionSchema.index({ boardId: 1 });

export default mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);
