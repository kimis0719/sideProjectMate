import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  target: 'all' | 'active';
  sentCount: number;
  sentBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    target: { type: String, enum: ['all', 'active'], required: true },
    sentCount: { type: Number, default: 0 },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });

export default mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
