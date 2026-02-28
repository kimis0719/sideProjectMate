import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  authorEmail: string;
  password: string;
  nName?: string;
  mblNo?: string;
  memberType: 'user' | 'admin';
  delYn: boolean;
  uid: number;
  // 프로필 확장 필드
  position?: string;
  career?: string;
  status?: string;
  avatarUrl?: string; // 프로필 이미지 URL
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
      required: true,
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
    // 프로필 확장 필드 스키마
    position: { type: String, default: '' },
    career: { type: String, default: '' }, // 예: 'Junior', 'Senior', '3년차' 등
    status: { type: String, default: '구직중' }, // 예: '구직중', '재직중', '팀빌딩중'
    avatarUrl: { type: String, default: '' },
    introduction: { type: String, default: '' },
    socialLinks: {
      github: { type: String, default: '' },
      blog: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      other: { type: String, default: '' },
      solvedAc: { type: String, default: '' },
    },
    // 포트폴리오 링크 배열
    portfolioLinks: {
      type: [String],
      default: [],
    },
    // GitHub 통계 정보
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
    // 기술 스택 태그
    techTags: {
      type: [String],
      default: [],
    },
    // 개발자 레벨 (1~10)
    level: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// 비밀번호 해싱 미들웨어
UserSchema.pre('save', async function (next) {
  const user = this as unknown as IUser;

  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// 비밀번호 검증 메소드
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// memberbasics 컬렉션 사용
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'memberbasics');

