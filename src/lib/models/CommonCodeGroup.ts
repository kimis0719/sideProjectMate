import mongoose, { Document, Schema } from 'mongoose';

export interface ICommonCodeGroup extends Document {
  group: string;
  groupName: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommonCodeGroupSchema: Schema = new Schema(
  {
    group: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CommonCodeGroup ||
  mongoose.model<ICommonCodeGroup>('CommonCodeGroup', CommonCodeGroupSchema);
