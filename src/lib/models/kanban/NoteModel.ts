import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface INote extends Document {
  text: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
  tags: string[];
  dueDate?: Date;
  assigneeId?: string;
  creatorId: mongoose.Types.ObjectId;
  updaterId?: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
}

const NoteSchema: Schema = new Schema(
  {
    text: {
      type: String,
      required: true,
      default: '새 노트',
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: '#FFFB8F',
    },
    width: {
      type: Number,
      default: 200,
    },
    height: {
      type: Number,
      default: 140,
    },
    tags: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
    },
    assigneeId: {
      type: String,
    },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updaterId: { type: Schema.Types.ObjectId, ref: 'User' },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board', // Board 모델 참조
      required: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
  },
  { timestamps: true }
);

NoteSchema.index({ boardId: 1 });
NoteSchema.index({ sectionId: 1 });

export default models.Note || model<INote>('Note', NoteSchema);
