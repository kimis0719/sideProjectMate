import mongoose, { Document, Schema } from 'mongoose';
import { IProject } from './Project';
import { IUser } from './User';

export interface IApplication extends Document {
  projectId: IProject['_id'];
  applicantId: IUser['_id'];
  motivation: string;
  weeklyHours: number;
  message?: string;
  ownerNote?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
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
    motivation: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    weeklyHours: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    ownerNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// 한 사용자는 한 프로젝트에 한 번만 지원 가능
ApplicationSchema.index({ projectId: 1, applicantId: 1 }, { unique: true });

export default mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema);
