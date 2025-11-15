import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IBoard extends Document {
  pid: number;
  name: string;
  ownerId: string; // TODO: User 모델과 연결되면 ObjectId로 변경
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
      type: String, // TODO: { type: Schema.Types.ObjectId, ref: 'User' }
      required: true,
    },
  },
  { timestamps: true }
);

export default models.Board || model<IBoard>('Board', BoardSchema, 'boards');
