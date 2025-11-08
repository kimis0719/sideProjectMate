import mongoose, { Document, Schema } from 'mongoose';
import './TechStack'; // Mongoose가 'TechStack' 모델을 인식하도록 함

export interface IProject extends Document {
  pid: number;
  title: string;
  category: string;
  author: string; // TODO: User 모델과 연결
  members: {
    current: number;
    max: number;
  };
  tags: (mongoose.Types.ObjectId | string)[]; // TechStack 모델의 ID 배열
  images: string[]; // 이미지 URL 배열
  content: string;
  status: 'recruiting' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    pid: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    author: { type: String, required: true }, // TODO: { type: Schema.Types.ObjectId, ref: 'User' }
    members: {
      current: { type: Number, required: true, default: 1 },
      max: { type: Number, required: true, default: 4 },
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'TechStack' }],
    images: {
      type: [String],
      default: ['🚀'], // 기본 이미지
    },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['recruiting', 'in-progress', 'completed'],
      default: 'recruiting',
    },
  },
  { timestamps: true }
);

// 가상 필드(virtual field) 추가: membersString
ProjectSchema.virtual('membersString').get(function () {
  return `${this.members.current}/${this.members.max}`;
});

// toJSON, toObject 설정
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema, 'projects');
