import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  projectId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId; // 리뷰 작성자
  revieweeId: mongoose.Types.ObjectId; // 리뷰 대상자
  rating: number; // 1~5
  tags: string[]; // REVIEW_TAGS 값
  comment?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    tags: {
      type: [String],
      default: [],
    },
    comment: {
      type: String,
      maxlength: 200,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 동일 프로젝트 내 같은 대상에 중복 리뷰 방지
ReviewSchema.index({ projectId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
