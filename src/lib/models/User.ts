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

