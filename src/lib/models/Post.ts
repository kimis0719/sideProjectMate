import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  authorEmail?: string;
  viewCount: number;
  like: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    authorEmail: {
      type: String,
      trim: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    like: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// posts 컬렉션 사용
export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema, 'posts');

