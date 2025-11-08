import mongoose, { Document, Schema } from 'mongoose';

export interface ITechStack extends Document {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'etc';
  logoUrl?: string; // 로고 이미지 URL (선택)
}

const TechStackSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['frontend', 'backend', 'database', 'devops', 'mobile', 'etc'],
  },
  logoUrl: {
    type: String,
    trim: true,
  },
});

export default mongoose.models.TechStack || mongoose.model<ITechStack>('TechStack', TechStackSchema, 'techstacks');
