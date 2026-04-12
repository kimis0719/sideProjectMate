import mongoose, { Schema, Document } from 'mongoose';

export interface IAiUsageAlert extends Document {
  date: string; // YYYY-MM-DD
  level: 'info' | 'warning' | 'critical' | 'kill';
  percent: number;
  todayRequests: number;
  todayTokens: number;
  dailyRequestLimit: number;
  dailyTokenLimit: number;
  notifiedAt: Date;
}

const AiUsageAlertSchema = new Schema<IAiUsageAlert>(
  {
    date: { type: String, required: true },
    level: {
      type: String,
      enum: ['info', 'warning', 'critical', 'kill'],
      required: true,
    },
    percent: { type: Number, required: true },
    todayRequests: { type: Number, required: true },
    todayTokens: { type: Number, required: true },
    dailyRequestLimit: { type: Number, required: true },
    dailyTokenLimit: { type: Number, required: true },
    notifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 같은 날짜 + 같은 레벨은 1회만 발송
AiUsageAlertSchema.index({ date: 1, level: 1 }, { unique: true });

export default mongoose.models.AiUsageAlert ||
  mongoose.model<IAiUsageAlert>('AiUsageAlert', AiUsageAlertSchema);
