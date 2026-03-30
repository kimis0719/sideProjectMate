import mongoose, { Document, Schema } from 'mongoose';
import {
  PROJECT_STAGES,
  ProjectStage,
  PROJECT_STATUSES,
  ProjectStatus,
  EXECUTION_STYLES,
  ExecutionStyle,
} from '@/constants/project';

export interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  role: string;
  status: 'active' | 'inactive' | 'removed';
  joinedAt: Date;
}

// 📝 [리소스 인터페이스] 프로젝트 내 공유 자원 구조 정의
export interface IResource {
  type: 'LINK' | 'TEXT';
  category: 'CODE' | 'DESIGN' | 'DOCS' | 'ENV' | 'ACCOUNT' | 'OTHER';
  content: string;
  metadata?: {
    title?: string;
    image?: string;
    description?: string;
    [key: string]: string | undefined;
  };
  userId?: string | mongoose.Types.ObjectId;
  _id?: string;
}

export interface IProject extends Document {
  pid: number;
  title: string;
  ownerId: mongoose.Types.ObjectId;
  members: IProjectMember[];
  description: string;
  status: ProjectStatus;
  delYn: boolean;
  overview?: string;
  resources: IResource[];
  deadline?: Date;
  views: number;
  likeCount: number;
  techStacks: string[];
  images: string[];
  // Phase 1 신규 필드
  problemStatement: string;
  currentStage: ProjectStage;
  executionStyle: ExecutionStyle;
  domains: string[];
  lookingFor: string[];
  weeklyHours: number;
  durationMonths?: number;
  maxMembers: number;
  links?: {
    github?: string;
    figma?: string;
    deploy?: string;
    notion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSubSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'member' },
    status: { type: String, enum: ['active', 'inactive', 'removed'], default: 'active' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProjectSchema: Schema = new Schema(
  {
    pid: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [ProjectMemberSubSchema], default: [] },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'recruiting',
    },
    delYn: { type: Boolean, default: false },
    overview: { type: String },
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
        metadata: { type: Object },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    deadline: { type: Date },
    views: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    techStacks: { type: [String], default: [] },
    images: { type: [String], default: ['🚀'] },
    // Phase 1 신규 필드
    problemStatement: { type: String, maxlength: 500 },
    currentStage: { type: String, enum: PROJECT_STAGES },
    executionStyle: { type: String, enum: EXECUTION_STYLES },
    domains: { type: [String], default: [] },
    lookingFor: { type: [String], default: [] },
    weeklyHours: { type: Number },
    durationMonths: { type: Number },
    maxMembers: { type: Number, default: 4 },
    links: {
      github: { type: String },
      figma: { type: String },
      deploy: { type: String },
      notion: { type: String },
    },
  },
  { timestamps: true }
);

ProjectSchema.virtual('likesCount').get(function (this: IProject) {
  return this.likeCount ?? 0;
});

ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

ProjectSchema.index({ delYn: 1, createdAt: -1 });
ProjectSchema.index({ delYn: 1, status: 1, createdAt: -1 });
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ delYn: 1, deadline: 1 });
ProjectSchema.index({ domains: 1 });
ProjectSchema.index({ currentStage: 1 });
ProjectSchema.index({ executionStyle: 1 });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
