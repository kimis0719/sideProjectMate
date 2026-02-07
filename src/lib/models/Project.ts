import mongoose, { Document, Schema } from 'mongoose';
import './TechStack';
import './ProjectMember';
import { IUser } from './User';

// 📝 [리소스 인터페이스] 프로젝트 내 공유 자원 구조 정의
export interface IResource {
  type: 'LINK' | 'TEXT'; // 리소스 형태 (링크형, 텍스트형)
  category: 'CODE' | 'DESIGN' | 'DOCS' | 'ENV' | 'ACCOUNT' | 'OTHER'; // 리소스 분류
  content: string; // URL 또는 텍스트 내용
  metadata?: Record<string, any>; // OG 태그 정보나 추가 설명을 위한 메타데이터
  userId?: string | any; // ✨ [추가] 리소스 등록자 ID
  _id?: string; // 클라이언트 식별용
}

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
  overview?: string; // ✨ [추가] 프로젝트 개요 (PM 전용 관리 필드)
  resources: IResource[]; // ✨ [추가] 프로젝트 공유 자원 리스트
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
    overview: { type: String }, // ✨ [추가] 프로젝트 개요
    // ✨ [리소스 필드 스키마]
    resources: [
      {
        type: {
          type: String,
          enum: ['LINK', 'TEXT'],
          required: true,
        },
        category: {
          type: String,
          enum: ['CODE', 'DESIGN', 'DOCS', 'ENV', 'ACCOUNT', 'OTHER'],
          required: true,
        },
        content: { type: String, required: true },
        metadata: { type: Object }, // 유연성을 위해 Object 타입 사용 (OG 정보 등)
        userId: { type: Schema.Types.ObjectId, ref: 'User' }, // ✨ [추가] 등록자 추적
      },
    ],
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
