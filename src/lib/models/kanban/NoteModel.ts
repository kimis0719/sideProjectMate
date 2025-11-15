import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface INote extends Document {
  text: string;
  x: number;
  y: number;
  color: string;
  boardId: mongoose.Types.ObjectId;
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
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board', // Board 모델 참조
      required: true,
      index: true, // boardId로 노트를 빠르게 찾기 위해 인덱스 추가
    },
  },
  { timestamps: true }
);

export default models.Note || model<INote>('Note', NoteSchema, 'notes');
