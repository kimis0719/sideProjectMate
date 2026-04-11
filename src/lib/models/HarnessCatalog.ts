import mongoose, { Schema, Document } from 'mongoose';

export interface IHarnessAgent {
  name: string;
  role: string;
  description: string;
  filename: string; // e.g., "architect.md"
}

export interface IHarnessSkill {
  name: string;
  type: 'orchestrator' | 'domain';
  description: string;
  dirname: string; // e.g., "team-orchestrator"
}

// filesCache는 flat key 구조: "CLAUDE.md", "agents/architect.md", "skills/team-orchestrator/skill.md" 등
export type IHarnessFilesCache = Record<string, string>;

export interface IHarnessCatalog extends Document {
  harnessId: string; // e.g., "01-nextjs-fullstack"
  name: string;
  domain: string;
  description: string;
  tags: string[];
  techStacks: string[];
  agents: IHarnessAgent[];
  skills: IHarnessSkill[];
  architecturePattern: string;
  filesCache: {
    ko: IHarnessFilesCache;
    en: IHarnessFilesCache;
  };
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HarnessAgentSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, default: '' },
    filename: { type: String, required: true },
  },
  { _id: false }
);

const HarnessSkillSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['orchestrator', 'domain'], required: true },
    description: { type: String, default: '' },
    dirname: { type: String, required: true },
  },
  { _id: false }
);

const HarnessCatalogSchema = new Schema<IHarnessCatalog>(
  {
    harnessId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    domain: { type: String, required: true },
    description: { type: String, default: '' },
    tags: [{ type: String }],
    techStacks: [{ type: String }],
    agents: [HarnessAgentSchema],
    skills: [HarnessSkillSchema],
    architecturePattern: {
      type: String,
      enum: [
        'pipeline',
        'fan-out-fan-in',
        'expert-pool',
        'producer-reviewer',
        'supervisor',
        'hierarchical',
      ],
    },
    filesCache: { type: Schema.Types.Mixed, default: { ko: {}, en: {} } },
    lastSyncAt: { type: Date },
  },
  { timestamps: true }
);

// 추천 쿼리용 인덱스 (태그/기술스택 기반 필터링)
HarnessCatalogSchema.index({ tags: 1 });
HarnessCatalogSchema.index({ techStacks: 1 });
// 도메인별 조회
HarnessCatalogSchema.index({ domain: 1 });

export default mongoose.models.HarnessCatalog ||
  mongoose.model<IHarnessCatalog>('HarnessCatalog', HarnessCatalogSchema);
