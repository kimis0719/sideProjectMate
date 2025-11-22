import mongoose, { Document, Schema } from 'mongoose';
import './TechStack';
import { IUser } from './User';

export interface IProject extends Document {
  pid: number;
  title: string;
  category: string;
  author: IUser['_id'];
  members: {
    role: string;
    current: number;
    max: number;
  }[];
  tags: (mongoose.Types.ObjectId | string)[];
  images: string[];
  content: string;
  status: '01' | '02' | '03'; // 01: 모집중, 02: 진행중, 03: 완료
  deadline?: Date;
  views: number;
  likes: IUser['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    pid: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        role: { type: String, required: true },
        current: { type: Number, required: true, default: 0 },
        max: { type: Number, required: true, default: 1 },
      },
    ],
    tags: [{ type: Schema.Types.ObjectId, ref: 'TechStack' }],
    images: {
      type: [String],
      default: ['🚀'],
    },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['01', '02', '03'], // 01: 모집중, 02: 진행중, 03: 완료
      default: '01',
    },
    deadline: { type: Date },
    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// 가상 필드 getter에 방어 코드 추가
ProjectSchema.virtual('membersString').get(function (this: IProject) {
  if (!this.members) {
    return '';
  }
  return this.members.map(m => `${m.role} ${m.current}/${m.max}`).join(', ');
});

ProjectSchema.virtual('likesCount').get(function (this: IProject) {
  if (!this.likes) {
    return 0;
  }
  return this.likes.length;
});

// ProjectMember와의 가상 관계 설정
ProjectSchema.virtual('projectMembers', {
  ref: 'ProjectMember',
  localField: '_id',
  foreignField: 'projectId',
});

ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
