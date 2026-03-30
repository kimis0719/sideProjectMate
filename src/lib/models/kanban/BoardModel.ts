import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IBoard extends Document {
  pid: number;
  name: string;
  ownerId: mongoose.Types.ObjectId | string; // string: 'system' 보드 레거시 허용
}

const BoardSchema: Schema = new Schema(
  {
    pid: {
      type: Number,
      required: true,
      unique: true,
      index: true, // pid로 보드를 빠르게 찾기 위해 인덱스 추가
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default models.Board || model<IBoard>('Board', BoardSchema, 'boards');
