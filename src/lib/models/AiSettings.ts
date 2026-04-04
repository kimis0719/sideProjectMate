import mongoose, { Schema, Document, Types } from 'mongoose';

/* ── 프리셋 서브도큐먼트 ── */
export interface IDefaultPreset {
  name: string;
  roleInstruction: string;
  description: string;
}

/* ── AiSettings 인터페이스 ── */
export interface IModelPriority {
  modelName: string;
  priority: number; // 1 = 최우선, 2, 3
}

export interface IAiSettings extends Document {
  // 기본 설정
  provider: 'gemini' | 'anthropic' | 'openai';
  modelName: string; // 레거시 호환 (modelPriority[0] 동기화)
  modelPriority: IModelPriority[]; // 우선순위 모델 목록 (최대 3개)
  enabled: boolean;
  cooldownMinutes: number;
  dailyLimitPerProject: number;

  // 프롬프트 템플릿
  systemPromptTemplate: string;

  // 컨텍스트 포함 토글
  contextIncludeOverview: boolean;
  contextIncludeResources: boolean;
  contextIncludeMembers: boolean;
  contextIncludeDeadline: boolean;

  // 기본 프리셋
  defaultPresets: IDefaultPreset[];

  // 가드레일 패턴 (정규식 문자열 배열, 서버 사이드 검증용)
  guardRailPatterns: string[];

  // 메타
  updatedBy: Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

/* ── 기본 시스템 프롬프트 템플릿 ── */
export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `당신은 프로젝트 관리 보드의 노트를 AI 코딩 에이전트가 즉시 실행 가능한 지시서(Markdown)로 변환하는 전문가입니다.

## 규칙
1. 코드를 직접 작성하지 마세요. 소스에 접근할 수 없습니다.
2. 코딩 에이전트가 무엇을 해야 하는지 명확하게 지시하세요.
3. 모호한 메모를 구체적인 작업 단위로 분해하세요.
4. 한국어로 작성하세요.

## 프로젝트 정보
- 이름: {{projectTitle}}
- 상태: {{projectStatus}}
- 마감일: {{deadline}}
{{#if problemStatement}}
- 문제/동기: {{problemStatement}}
{{/if}}
{{#if domains}}
- 도메인: {{domains}}
{{/if}}
{{#if executionStyle}}
- 실행 방식: {{executionStyle}}
{{/if}}
{{#if techStacks}}
- 기술스택: {{techStacks}}
{{/if}}

{{#if overview}}
## 프로젝트 개요
{{overview}}
{{/if}}

{{#if resources}}
## 참고 리소스
{{resources}}
{{/if}}

{{#if members}}
## 팀원
{{members}}
{{/if}}

{{#if referenceNotes}}
## 참조 컨텍스트
{{referenceNotes}}
{{/if}}

## 지시 대상 노트
{{targetNotes}}`;

/* ── 기본 프리셋 ── */
export const DEFAULT_PRESETS: IDefaultPreset[] = [
  {
    name: '기능 구현',
    roleInstruction: '새로운 기능을 구현하는 데 필요한 단계별 지시를 생성하세요.',
    description: '새 기능 개발을 위한 구체적인 구현 지시서',
  },
  {
    name: '버그 수정',
    roleInstruction: '버그의 원인을 분석하고 수정 방법을 단계별로 지시하세요.',
    description: '버그 원인 분석 및 수정 단계 가이드',
  },
  {
    name: '리팩토링',
    roleInstruction:
      '코드 품질을 개선하기 위한 리팩토링 지시를 생성하세요. 기존 동작을 변경하지 않도록 주의하세요.',
    description: '코드 구조 개선 및 기술 부채 해소',
  },
  {
    name: '테스트 작성',
    roleInstruction: '테스트 코드를 작성하기 위한 지시를 생성하세요. 엣지 케이스를 포함하세요.',
    description: '단위/통합 테스트 코드 작성 가이드',
  },
  {
    name: '문서화',
    roleInstruction: '코드 및 API에 대한 문서를 작성하기 위한 지시를 생성하세요.',
    description: 'README, API 문서, 주석 작성 가이드',
  },
];

/* ── 프리셋 스키마 ── */
const DefaultPresetSchema = new Schema(
  {
    name: { type: String, required: true },
    roleInstruction: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: true }
);

/* ── AiSettings 스키마 ── */
const AiSettingsSchema = new Schema<IAiSettings>(
  {
    provider: {
      type: String,
      enum: ['gemini', 'anthropic', 'openai'],
      default: 'gemini',
    },
    modelName: { type: String, default: 'gemini-2.5-flash' },
    modelPriority: {
      type: [
        {
          modelName: { type: String, required: true },
          priority: { type: Number, required: true },
        },
      ],
      default: [
        { modelName: 'gemini-2.5-flash', priority: 1 },
        { modelName: 'gemini-2.5-flash-lite', priority: 2 },
      ],
    },
    enabled: { type: Boolean, default: true },
    cooldownMinutes: { type: Number, default: 3, min: 0 },
    dailyLimitPerProject: { type: Number, default: 50, min: 1 },

    systemPromptTemplate: {
      type: String,
      default: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
    },

    contextIncludeOverview: { type: Boolean, default: true },
    contextIncludeResources: { type: Boolean, default: true },
    contextIncludeMembers: { type: Boolean, default: true },
    contextIncludeDeadline: { type: Boolean, default: true },

    defaultPresets: {
      type: [DefaultPresetSchema],
      default: DEFAULT_PRESETS,
    },

    guardRailPatterns: {
      type: [String],
      default: [
        '너는\\s*(?:이제|이다)',
        '역할을?\\s*바꿔',
        '이전\\s*(?:지시|명령).*무시',
        '(?:위|앞).*명령.*무시',
        'ignore\\s+(?:above|previous|instructions)',
        'forget\\s+(?:everything|all)',
        '\\d+번\\s*반복',
        '위\\s*내용.*반복',
        'api\\s*키.*(?:출력|알려|보여)',
        '비밀번호.*(?:알려|출력|보여)',
      ],
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

/* ── 싱글턴 헬퍼: 항상 하나의 문서만 유지 ── */
AiSettingsSchema.statics.getInstance = async function (): Promise<IAiSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export interface IAiSettingsModel extends mongoose.Model<IAiSettings> {
  getInstance(): Promise<IAiSettings>;
}

export default (mongoose.models.AiSettings as IAiSettingsModel) ||
  mongoose.model<IAiSettings, IAiSettingsModel>('AiSettings', AiSettingsSchema);
