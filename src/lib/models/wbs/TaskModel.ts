import mongoose, { Schema, models, model, Document } from 'mongoose';

/**
 * 의존관계 타입
 * - FS (Finish-to-Start): 선행 작업이 끝나야 현재 작업 시작
 * - SS (Start-to-Start): 선행 작업 시작과 동시에 현재 작업 시작 가능
 * - FF (Finish-to-Finish): 선행 작업과 현재 작업이 동시에 끝나야 함
 */
export type DependencyType = 'FS' | 'SS' | 'FF';

/**
 * 의존관계 정보
 */
export interface IDependency {
  taskId: mongoose.Types.ObjectId;  // 선행 작업 ID
  type: DependencyType;              // 의존관계 타입
}

/**
 * WBS Task 인터페이스
 * 프로젝트의 작업(Task)을 정의하는 타입입니다.
 */
export interface ITask extends Document {
  pid: number;                          // 프로젝트 ID (어느 프로젝트의 작업인지 식별)
  title: string;                        // 작업명
  description: string;                  // 작업 상세 설명
  assignee: mongoose.Types.ObjectId;    // 담당자 (User 모델 참조)
  startDate: Date;                      // 작업 시작일
  endDate: Date;                        // 작업 종료일
  status: 'todo' | 'in-progress' | 'done';  // 진행 상태
  progress: number;                     // 진행률 (0-100%)
  dependencies: IDependency[];          // 선행 작업 및 의존관계 타입
  phase: string;                        // 단계/그룹명 (예: 기획, 개발, 테스트)
  milestone: boolean;                   // 마일스톤 여부 (phase의 주요 완료 시점 표시)
  createdAt: Date;                      // 생성일시
  updatedAt: Date;                      // 수정일시
}

/**
 * Task Mongoose 스키마
 * MongoDB에 저장될 Task 문서의 구조를 정의합니다.
 */
const TaskSchema: Schema = new Schema(
  {
    // 프로젝트 ID - 어느 프로젝트의 작업인지 식별하기 위한 필드
    pid: {
      type: Number,
      required: true,
      index: true,  // pid로 빠른 조회를 위해 인덱스 추가
    },
    // 작업명 - 간트차트에 표시될 작업의 제목
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    // 작업 설명 - 작업의 상세 내용
    description: {
      type: String,
      default: '',
      trim: true,
    },
    // 담당자 - User 모델을 참조하는 ObjectId
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // 시작일 - 간트차트에서 작업 바의 시작 위치를 결정
    startDate: {
      type: Date,
      required: true,
    },
    // 종료일 - 간트차트에서 작업 바의 끝 위치를 결정
    endDate: {
      type: Date,
      required: true,
      validate: {
        // 종료일이 시작일보다 이전일 수 없도록 검증
        validator: function(this: ITask, value: Date) {
          return value >= this.startDate;
        },
        message: '종료일은 시작일보다 이후여야 합니다.',
      },
    },
    // 진행 상태 - 작업의 현재 상태
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    // 진행률 - 0에서 100 사이의 값으로 작업 완료 정도를 표시
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // 선행 작업 - 이 작업이 시작되기 전에 완료되어야 할 작업들의 ID 배열
    // 간트차트에서 화살표로 의존성을 표시할 때 사용
    dependencies: {
      type: [{
        taskId: {
          type: Schema.Types.ObjectId,
          ref: 'Task',
          required: true,
        },
        type: {
          type: String,
          enum: ['FS', 'SS', 'FF'],
          default: 'FS',
        },
      }],
      default: [],
    },
    // 단계/그룹명 - 작업을 그룹화하는 단계 (예: "기획", "개발", "테스트", "배포")
    phase: {
      type: String,
      default: '기본',
      trim: true,
      maxlength: 100,
    },
    // 마일스톤 여부 - phase의 주요 완료 시점을 표시하는 작업
    // 간트차트에서 다이아몬드 모양으로 표시
    milestone: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true  // createdAt, updatedAt 자동 생성
  }
);

/**
 * 인덱스 설정
 * - pid: 프로젝트별 작업 조회 성능 향상
 * - startDate, endDate: 날짜 범위 검색 성능 향상
 */
TaskSchema.index({ pid: 1, startDate: 1 });
TaskSchema.index({ pid: 1, endDate: 1 });

/**
 * Task 모델 export
 * 이미 모델이 존재하면 기존 모델을 사용하고, 없으면 새로 생성합니다.
 * (Next.js의 Hot Reload 시 모델 중복 생성 방지)
 */
export default models.Task || model<ITask>('Task', TaskSchema, 'tasks');
