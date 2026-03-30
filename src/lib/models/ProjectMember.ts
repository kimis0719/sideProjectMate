/**
 * @deprecated Phase 1 (2026-03-30) — projectmembers 데이터가 projects.members embedded로 통합됨.
 * 신규 코드에서 이 모델을 import하지 말 것.
 * 컬렉션 및 파일 삭제는 Phase 7 cleanup에서 처리.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectMember extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  status: 'active' | 'inactive' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema: Schema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'removed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// 프로젝트 멤버 인덱스 설정
ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export default mongoose.models.ProjectMember ||
  mongoose.model<IProjectMember>('ProjectMember', ProjectMemberSchema, 'projectmembers');
