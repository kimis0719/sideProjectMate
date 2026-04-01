import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProjectApiKey extends Document {
  pid: number; // Project.pid
  key: string; // "spm_" + randomBytes(32).toString('hex')
  createdBy: Types.ObjectId;
  lastUsedAt?: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectApiKeySchema = new Schema<IProjectApiKey>(
  {
    pid: { type: Number, required: true, index: true },
    key: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastUsedAt: { type: Date },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectApiKey ||
  mongoose.model<IProjectApiKey>('ProjectApiKey', ProjectApiKeySchema);
