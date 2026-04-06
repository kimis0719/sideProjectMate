import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  detail: string;
  ip: string;
  createdAt: Date;
}

const AdminAuditLogSchema: Schema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    targetLabel: { type: String, default: '' },
    detail: { type: String, default: '' },
    ip: { type: String, default: 'unknown' },
  },
  { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ targetType: 1, createdAt: -1 });

// 90일 TTL — 오래된 로그 자동 삭제
AdminAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.models.AdminAuditLog ||
  mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
