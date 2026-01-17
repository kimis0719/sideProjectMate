import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IProject } from './Project';

export interface INotification extends Document {
  recipient: IUser['_id']; // 알림을 받는 사람
  sender: IUser['_id']; // 알림을 발생시킨 사람
  type: 'new_applicant' | 'application_accepted' | 'application_rejected' | 'assign_note'; // 알림 종류
  project: IProject['_id']; // 관련 프로젝트
  read: boolean; // 읽음 여부
  metadata?: Record<string, any>; // 추가 데이터 (예: noteId)
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['new_applicant', 'application_accepted', 'application_rejected', 'assign_note'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
