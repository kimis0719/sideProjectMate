import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  authorEmail: string;
  password: string;
  nName?: string;
  mblNo?: string;
  memberType: string;
  delYn: boolean;
  uid: number;
  // 프로필 확장 필드
  position?: string;
  career?: string;
  status?: string;
  introduction?: string;
  socialLinks?: {
    github?: string;
    blog?: string;
    linkedin?: string;
    other?: string;
  };
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
    introduction: { type: String, default: '' },
    socialLinks: {
      github: { type: String, default: '' },
      blog: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      other: { type: String, default: '' },
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

