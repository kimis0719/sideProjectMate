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

export default mongoose.models.ProjectMember || mongoose.model<IProjectMember>('ProjectMember', ProjectMemberSchema, 'projectmembers');
