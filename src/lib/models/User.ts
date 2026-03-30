import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { WORK_STYLES, WorkStyle, LAUNCH_STYLES, LaunchStyle } from '@/constants/user';

export interface IUser extends Document {
  authorEmail: string;
  password: string;
  nName?: string;
  mblNo?: string;
  memberType: 'user' | 'admin';
  delYn: boolean;
  uid: number;
  providers?: string[]; // 인증 방식 ('credentials', 'github', 'google')
  // 프로필 확장 필드
  position?: string;
  career?: string;
  status?: string;
  avatarUrl?: string;
  introduction?: string;
  socialLinks?: {
    github?: string;
    blog?: string;
    linkedin?: string;
    other?: string;
    solvedAc?: string;
  };
  portfolioLinks?: string[];
  githubStats?: {
    followers: number;
    following: number;
    totalStars: number;
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    contributions: number;
    techStack: string[];
  };
  techTags?: string[];
  level?: number;
  // Phase 1 신규 필드
  bio?: string;
  domains?: string[];
  workStyle?: WorkStyle[];
  weeklyAvailability?: number;
  preferLaunchStyle?: LaunchStyle;
  onboardingStep?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    authorEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      default: '',
    },
    nName: {
      type: String,
      trim: true,
    },
    mblNo: {
      type: String,
      trim: true,
    },
    memberType: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    delYn: {
      type: Boolean,
      default: false,
    },
    uid: {
      type: Number,
      required: true,
      unique: true,
    },
    providers: {
      type: [String],
      default: [],
    },
    position: { type: String, default: '' },
    career: { type: String, default: '' },
    status: { type: String, default: '구직중' },
    avatarUrl: { type: String, default: '' },
    introduction: { type: String, default: '' },
    socialLinks: {
      github: { type: String, default: '' },
      blog: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      other: { type: String, default: '' },
      solvedAc: { type: String, default: '' },
    },
    portfolioLinks: {
      type: [String],
      default: [],
    },
    githubStats: {
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      totalCommits: { type: Number, default: 0 },
      totalPRs: { type: Number, default: 0 },
      totalIssues: { type: Number, default: 0 },
      contributions: { type: Number, default: 0 },
      techStack: { type: [String], default: [] },
    },
    techTags: {
      type: [String],
      default: [],
    },
    level: {
      type: Number,
      default: 1,
    },
    // Phase 1 신규 필드
    bio: { type: String, maxlength: 200, default: '' },
    domains: { type: [String], default: [] },
    workStyle: {
      type: [String],
      enum: WORK_STYLES,
      default: [],
    },
    weeklyAvailability: { type: Number, default: 0 },
    preferLaunchStyle: { type: String, enum: LAUNCH_STYLES },
    onboardingStep: { type: Number, default: 0, min: 0, max: 4 },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ delYn: 1, createdAt: -1 });
UserSchema.index({ domains: 1 });
UserSchema.index({ workStyle: 1 });
UserSchema.index({ onboardingStep: 1 });

UserSchema.pre('save', async function (next) {
  const user = this as unknown as IUser;

  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
