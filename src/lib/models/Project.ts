import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  title: string;
  content: string;
  authorEmail: string;
  techStack: string[];
  status: 'recruiting' | 'in_progress' | 'completed';
  maxMembers: number;
  currentMembers: number;
  viewCount: number;
  like: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
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
      required: true,
      trim: true,
    },
    techStack: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: ['recruiting', 'in_progress', 'completed'],
      default: 'recruiting',
    },
    maxMembers: {
      type: Number,
      default: 5,
    },
    currentMembers: {
      type: Number,
      default: 1,
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

// projects 컬렉션에 저장 (원래 posts 컬렉션에서 변경)
export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema, 'projects');
