// src/lib/models/CommonCode.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICommonCode extends Document {
    group: string;      // CATEGORY_FILTER
    groupName: string;  // 카테고리필터
    code: string;       // 01
    label: string;      // 디자인
    order: number;      // 1
    isActive: boolean;  // true
}

const CommonCodeSchema: Schema = new Schema({
    group: { type: String, required: true, index: true }, // 조회 많이 하니까 인덱스!
    groupName: { type: String, required: true },
    code: { type: String, required: true },
    label: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
});

// 복합 인덱스: 같은 그룹 내에서는 코드가 유니크해야 함
CommonCodeSchema.index({ group: 1, code: 1 }, { unique: true });

export default mongoose.models.CommonCode || mongoose.model<ICommonCode>('CommonCode', CommonCodeSchema);