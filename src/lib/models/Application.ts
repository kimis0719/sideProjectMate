import mongoose, { Document, Schema } from 'mongoose';
import { IProject } from './Project';
import { IUser } from './User';

export interface IApplication extends Document {
  projectId: IProject['_id'];
  applicantId: IUser['_id'];
  role: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// 한 사용자는 한 프로젝트의 같은 역할에 한 번만 지원할 수 있도록 복합 인덱스 설정
ApplicationSchema.index({ projectId: 1, applicantId: 1, role: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
