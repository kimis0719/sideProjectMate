'use client';

import { useEffect, useState, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';
import AiModelTestPanel from '@/components/common/AiModelTestPanel';

/* ── 타입 ── */
interface DefaultPreset {
  _id?: string;
  name: string;
  roleInstruction: string;
  description: string;
}

interface ModelPriority {
  modelName: string;
  priority: number;
}

interface UsageAlertThreshold {
  percent: number;
  level: 'info' | 'warning' | 'critical';
}

interface AiSettingsData {
  provider: 'gemini' | 'anthropic' | 'openai';
  modelName: string;
  modelPriority: ModelPriority[];
  enabled: boolean;
  cooldownMinutes: number;
  dailyLimitPerProject: number;
  systemPromptTemplate: string;
  contextIncludeOverview: boolean;
  contextIncludeResources: boolean;
  contextIncludeMembers: boolean;
  contextIncludeDeadline: boolean;
  defaultPresets: DefaultPreset[];
  usageAlertThresholds: UsageAlertThreshold[];
  dailyRequestLimit: number;
  dailyTokenLimit: number;
  autoDisableOnLimit: boolean;
}

type TabKey = 'basic' | 'prompt' | 'presets' | 'alerts';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'basic', label: '기본 설정' },
  { key: 'prompt', label: '프롬프트 템플릿' },
  { key: 'presets', label: '기본 프리셋' },
  { key: 'alerts', label: '사용량 알림' },
];

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'openai', label: 'OpenAI GPT' },
];

const TEMPLATE_VARIABLES = [
  { name: 'projectTitle', desc: '프로젝트 이름' },
  { name: 'techStacks', desc: '기술스택 목록' },
  { name: 'projectStatus', desc: '프로젝트 상태' },
  { name: 'deadline', desc: '마감일' },
  { name: 'overview', desc: '프로젝트 개요 (조건부)' },
  { name: 'resources', desc: '리소스 목록 (조건부)' },
  { name: 'members', desc: '팀원 목록 (조건부)' },
  { name: 'referenceNotes', desc: '참조 노트 (조건부)' },
  { name: 'targetNotes', desc: '지시 대상 노트' },
  { name: 'presetInstruction', desc: '프리셋 역할 지시' },
  { name: 'additionalInstruction', desc: '사용자 추가 지시' },
  { name: 'currentDate', desc: '현재 날짜' },
];

/* ── 컴포넌트 ── */
export default function AiSettingsManager() {
  const { alert, confirm } = useModal();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [settings, setSettings] = useState<AiSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  /* ── fetch ── */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-settings');
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDirty(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ── save ── */
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDirty(false);
        await alert('저장 완료', 'AI 설정이 저장되었습니다.');
      } else {
        await alert('오류', json.message);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── helpers ── */
  const update = <K extends keyof AiSettingsData>(key: K, value: AiSettingsData[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  };

  const updatePreset = (index: number, field: keyof DefaultPreset, value: string) => {
    if (!settings) return;
    const updated = [...settings.defaultPresets];
    updated[index] = { ...updated[index], [field]: value };
    update('defaultPresets', updated);
  };

  const addPreset = () => {
    if (!settings) return;
    update('defaultPresets', [
      ...settings.defaultPresets,
      { name: '', roleInstruction: '', description: '' },
    ]);
  };

  const removePreset = async (index: number) => {
    if (!settings) return;
    const preset = settings.defaultPresets[index];
    const ok = await confirm(
      '프리셋 삭제',
      `"${preset.name || '새 프리셋'}"을(를) 삭제하시겠습니까?`,
      { confirmText: '삭제', isDestructive: true }
    );
    if (!ok) return;
    update(
      'defaultPresets',
      settings.defaultPresets.filter((_, i) => i !== index)
    );
  };

  /* ── 기본값 복원 ── */
  const handleResetTemplate = async () => {
    const ok = await confirm(
      '기본값 복원',
      '시스템 프롬프트 템플릿을 기본값으로 복원하시겠습니까?\n현재 작성한 내용은 사라집니다.',
      { confirmText: '복원', isDestructive: true }
    );
    if (!ok) return;
    // 서버에서 빈 상태의 기본값을 가져오기 위해 빈 문자열 전송 후 다시 fetch
    const res = await fetch('/api/admin/ai-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPromptTemplate: null }),
    });
    const json = await res.json();
    if (json.success) {
      await fetchSettings();
    }
  };

  /* ── render ── */
  if (loading || !settings) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container-low rounded w-1/3" />
          <div className="h-64 bg-surface-container-low rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">AI 지시서 설정</h1>
          <p className="font-body text-body-md text-on-surface-variant mt-1">
            AI 지시서 생성에 사용되는 LLM, 프롬프트, 프리셋을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="font-body text-body-md text-amber-600">저장되지 않은 변경사항</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="bg-primary-container text-on-primary rounded-lg px-6 py-2.5 font-body text-body-md font-semibold disabled:opacity-40
                       transition-colors"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-outline-variant/15 mb-6">
        <nav className="flex gap-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 transition-colors ${
                activeTab === key
                  ? 'text-primary border-b-2 border-primary font-semibold px-4 py-2.5 font-body text-body-md'
                  : 'text-on-surface-variant hover:text-on-surface px-4 py-2.5 font-body text-body-md'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'basic' && <BasicTab settings={settings} update={update} />}
      {activeTab === 'prompt' && (
        <PromptTab settings={settings} update={update} onReset={handleResetTemplate} />
      )}
      {activeTab === 'presets' && (
        <PresetsTab
          presets={settings.defaultPresets}
          updatePreset={updatePreset}
          addPreset={addPreset}
          removePreset={removePreset}
        />
      )}
      {activeTab === 'alerts' && <UsageAlertTab settings={settings} update={update} />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   기본 설정 탭
   ═══════════════════════════════════════════ */
interface ModelOption {
  id: string;
  name: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
}

type ConnectionStatus =
  | 'idle'
  | 'checking'
  | 'connected'
  | 'rate_limited'
  | 'not_found'
  | 'auth_error'
  | 'error'
  | 'unsupported';

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string }> = {
  idle: { label: '', color: '' },
  checking: { label: '확인 중...', color: 'text-amber-600 animate-pulse' },
  connected: { label: '연결됨', color: 'bg-emerald-50 text-emerald-600' },
  rate_limited: { label: '할당량 초과', color: 'bg-amber-50 text-amber-600' },
  not_found: { label: '모델 없음', color: 'bg-surface-container-high text-on-surface-variant' },
  auth_error: { label: 'API 키 오류', color: 'bg-error-container text-on-error-container' },
  error: { label: '연결 실패', color: 'bg-error-container text-on-error-container' },
  unsupported: { label: '미지원', color: 'bg-surface-container-high text-on-surface-variant' },
};

function BasicTab({
  settings,
  update,
}: {
  settings: AiSettingsData;
  update: <K extends keyof AiSettingsData>(key: K, value: AiSettingsData[K]) => void;
}) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // provider 변경 시 모델 목록 갱신
  const fetchModels = useCallback(async (provider: string) => {
    setModelsLoading(true);
    setModels([]);
    try {
      const res = await fetch(`/api/admin/ai-settings/models?provider=${provider}`);
      const json = await res.json();
      if (json.success) setModels(json.data);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels(settings.provider);
  }, [settings.provider, fetchModels]);

  // 연결 체크
  const checkConnection = useCallback(async (provider: string, modelName: string) => {
    setConnectionStatus('checking');
    setConnectionMessage('');
    try {
      const res = await fetch('/api/admin/ai-settings/check-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, modelName }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setConnectionStatus(json.data.status as ConnectionStatus);
        setConnectionMessage(json.data.message);
      }
    } catch {
      setConnectionStatus('error');
      setConnectionMessage('네트워크 오류');
    }
  }, []);

  // provider 또는 모델 변경 시 상태 초기화
  useEffect(() => {
    setConnectionStatus('idle');
    setConnectionMessage('');
  }, [settings.provider, settings.modelName]);

  const handleProviderChange = (provider: AiSettingsData['provider']) => {
    update('provider', provider);
    update('modelName', '');
    update('modelPriority', []);
  };

  return (
    <div className="space-y-6">
      {/* 기능 ON/OFF */}
      <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
        <div>
          <h3 className="font-semibold text-on-surface font-body text-body-md">AI 지시서 기능</h3>
          <p className="font-body text-body-md text-on-surface-variant">
            비활성화하면 모든 사용자에게 지시서 생성 버튼이 숨겨집니다.
          </p>
        </div>
        <button
          onClick={() => update('enabled', !settings.enabled)}
          className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-200 ${
            settings.enabled ? 'bg-primary' : 'bg-surface-container-high'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Provider */}
      <FieldGroup label="LLM Provider" desc="AI 지시서 생성에 사용할 LLM 제공자">
        <select
          value={settings.provider}
          onChange={(e) => handleProviderChange(e.target.value as AiSettingsData['provider'])}
          className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {PROVIDERS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FieldGroup>

      {/* 모델 우선순위 (최대 3개) */}
      <FieldGroup
        label="모델 우선순위"
        desc="할당량 초과 시 다음 순위 모델로 자동 전환됩니다 (최대 3개)"
      >
        {modelsLoading ? (
          <div className="px-3 py-2 text-on-surface-variant font-body text-body-md">
            모델 목록 불러오는 중...
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((priority) => {
              const current = (settings.modelPriority || []).find((m) => m.priority === priority);
              const selectedModel = models.find((m) => m.id === current?.modelName);

              return (
                <div key={priority} className="flex items-center gap-3">
                  <span className="font-body text-label-md font-bold text-on-surface-variant w-6 shrink-0">
                    #{priority}
                  </span>
                  <div className="flex-1">
                    <select
                      value={current?.modelName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const prev = (settings.modelPriority || []).filter(
                          (m) => m.priority !== priority
                        );
                        const next = val ? [...prev, { modelName: val, priority }] : prev;
                        next.sort((a, b) => a.priority - b.priority);
                        update('modelPriority', next);
                        // 1순위 모델은 modelName과 동기화
                        if (priority === 1) update('modelName', val);
                      }}
                      className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">
                        {priority === 1 ? '모델을 선택하세요' : '(사용 안 함)'}
                      </option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* 토큰 한도 표시 */}
                  {selectedModel && (
                    <div className="font-body text-label-md text-on-surface-variant whitespace-nowrap shrink-0">
                      <span className="text-primary font-medium">
                        {Math.round(selectedModel.inputTokenLimit / 1000)}K
                      </span>
                      {' / '}
                      <span className="text-tertiary font-medium">
                        {Math.round(selectedModel.outputTokenLimit / 1000)}K
                      </span>
                      <span className="ml-1 text-on-surface-variant">(in/out)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </FieldGroup>

      {/* 모델 연결 테스트 패널 */}
      {(settings.modelPriority || []).filter((m) => m.modelName).length > 0 && (
        <AiModelTestPanel provider={settings.provider} models={settings.modelPriority || []} />
      )}

      {/* Cooldown */}
      <FieldGroup label="쿨다운 (분)" desc="사용자 1인당 지시서 생성 간격 (분)">
        <input
          type="number"
          min={0}
          value={settings.cooldownMinutes}
          onChange={(e) => update('cooldownMinutes', Number(e.target.value))}
          className="w-32 bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </FieldGroup>

      {/* Daily limit */}
      <FieldGroup label="일일 한도" desc="프로젝트당 하루 최대 생성 횟수">
        <input
          type="number"
          min={1}
          value={settings.dailyLimitPerProject}
          onChange={(e) => update('dailyLimitPerProject', Number(e.target.value))}
          className="w-32 bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </FieldGroup>
    </div>
  );
}

/* ═══════════════════════════════════════════
   프롬프트 템플릿 탭
   ═══════════════════════════════════════════ */
function PromptTab({
  settings,
  update,
  onReset,
}: {
  settings: AiSettingsData;
  update: <K extends keyof AiSettingsData>(key: K, value: AiSettingsData[K]) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 왼쪽: 에디터 + 토글 */}
      <div className="lg:col-span-2 space-y-6">
        {/* 시스템 프롬프트 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-body text-body-md font-semibold text-on-surface">
              시스템 프롬프트 템플릿
            </label>
            <button
              onClick={onReset}
              className="font-body text-label-md text-on-surface-variant hover:text-error transition-colors"
            >
              기본값 복원
            </button>
          </div>
          <textarea
            value={settings.systemPromptTemplate}
            onChange={(e) => update('systemPromptTemplate', e.target.value)}
            rows={20}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary
                       font-mono leading-relaxed resize-y"
            placeholder="시스템 프롬프트를 입력하세요..."
          />
        </div>

        {/* 컨텍스트 포함 토글 */}
        <div>
          <h3 className="font-body text-body-md font-semibold text-on-surface mb-3">
            컨텍스트 포함 설정
          </h3>
          <div className="space-y-3">
            {(
              [
                { key: 'contextIncludeOverview', label: '프로젝트 개요 (overview)' },
                { key: 'contextIncludeResources', label: '프로젝트 리소스 (resources)' },
                { key: 'contextIncludeMembers', label: '팀원 목록 (members)' },
                { key: 'contextIncludeDeadline', label: '마감일 (deadline)' },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer font-body text-body-md text-on-surface-variant"
              >
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => update(key, e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant/15 text-primary focus:ring-primary"
                />
                {label} 포함
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽: 변수 레퍼런스 */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 p-4 bg-surface-container-low rounded-lg">
          <h3 className="font-body text-body-md font-semibold text-on-surface mb-3">
            사용 가능한 변수
          </h3>
          <div className="space-y-2">
            {TEMPLATE_VARIABLES.map(({ name, desc }) => (
              <div key={name} className="font-body text-label-md">
                <code className="px-1.5 py-0.5 bg-primary-container text-on-primary-container rounded font-mono">
                  {`{{${name}}}`}
                </code>
                <span className="ml-2 text-on-surface-variant">{desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/15">
            <p className="font-body text-label-md text-on-surface-variant">
              조건부 블록:
              <code className="block mt-1 px-1.5 py-0.5 bg-surface-container-high rounded font-mono">
                {'{{#if 변수}}...{{/if}}'}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   기본 프리셋 탭
   ═══════════════════════════════════════════ */
function PresetsTab({
  presets,
  updatePreset,
  addPreset,
  removePreset,
}: {
  presets: DefaultPreset[];
  updatePreset: (index: number, field: keyof DefaultPreset, value: string) => void;
  addPreset: () => void;
  removePreset: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-body-md text-on-surface-variant">
          모든 프로젝트에 기본으로 제공되는 프리셋입니다. 프로젝트별로 추가 프리셋을 만들 수도
          있습니다.
        </p>
        <button
          onClick={addPreset}
          className="bg-primary-container text-on-primary rounded-lg px-6 py-2.5 font-body text-body-md font-semibold
                     transition-colors"
        >
          + 프리셋 추가
        </button>
      </div>

      {presets.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">등록된 프리셋이 없습니다.</div>
      )}

      {presets.map((preset, i) => (
        <div
          key={preset._id ?? `new-${i}`}
          className="p-4 bg-surface-container-low rounded-lg space-y-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-label-md font-semibold text-on-surface-variant mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={preset.name}
                  onChange={(e) => updatePreset(i, 'name', e.target.value)}
                  className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="예: 기능 구현"
                />
              </div>
              <div>
                <label className="block font-body text-label-md font-semibold text-on-surface-variant mb-1">
                  설명
                </label>
                <input
                  type="text"
                  value={preset.description}
                  onChange={(e) => updatePreset(i, 'description', e.target.value)}
                  className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="프리셋에 대한 짧은 설명"
                />
              </div>
            </div>
            <button
              onClick={() => removePreset(i)}
              className="mt-5 text-on-surface-variant hover:text-error transition-colors font-body text-body-md"
              title="삭제"
            >
              삭제
            </button>
          </div>
          <div>
            <label className="block font-body text-label-md font-semibold text-on-surface-variant mb-1">
              역할 지시 (Role Instruction)
            </label>
            <textarea
              value={preset.roleInstruction}
              onChange={(e) => updatePreset(i, 'roleInstruction', e.target.value)}
              rows={3}
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              placeholder="이 프리셋을 선택했을 때 AI에게 전달할 역할 지시를 입력하세요."
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   사용량 알림 탭
   ═══════════════════════════════════════════ */

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  info: { label: '알림', color: 'text-blue-600', bg: 'bg-blue-500' },
  warning: { label: '경고', color: 'text-amber-600', bg: 'bg-amber-500' },
  critical: { label: '위험', color: 'text-red-600', bg: 'bg-red-500' },
};

interface UsageData {
  todayCount: number;
  todayTotalTokens: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  dailyRequestLimit: number;
  dailyTokenLimit: number;
  requestPercent: number;
  tokenPercent: number;
  todayAlerts: { level: string; percent: number; notifiedAt: string }[];
}

function UsageAlertTab({
  settings,
  update,
}: {
  settings: AiSettingsData;
  update: <K extends keyof AiSettingsData>(key: K, value: AiSettingsData[K]) => void;
}) {
  const { alert } = useModal();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await fetch('/api/admin/ai-settings/usage');
      const json = await res.json();
      if (json.success) setUsage(json.data);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleTestAlert = async () => {
    setTestSending(true);
    try {
      const res = await fetch('/api/admin/ai-settings/test-alert', { method: 'POST' });
      const json = await res.json();
      await alert(json.success ? '전송 완료' : '전송 실패', json.message);
    } catch {
      await alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setTestSending(false);
    }
  };

  const updateThreshold = (index: number, field: 'percent' | 'level', value: number | string) => {
    const updated = [...(settings.usageAlertThresholds || [])];
    updated[index] = { ...updated[index], [field]: value };
    update('usageAlertThresholds', updated);
  };

  const addThreshold = () => {
    const current = settings.usageAlertThresholds || [];
    update('usageAlertThresholds', [...current, { percent: 50, level: 'info' as const }]);
  };

  const removeThreshold = (index: number) => {
    const current = settings.usageAlertThresholds || [];
    update(
      'usageAlertThresholds',
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 오늘 사용량 현황 ── */}
      <div className="p-5 bg-surface-container-low rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-on-surface font-body text-body-md">오늘 사용량 현황</h3>
          <button
            onClick={fetchUsage}
            disabled={usageLoading}
            className="font-body text-label-md text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
          >
            {usageLoading ? '로딩 중...' : '새로고침'}
          </button>
        </div>

        {usageLoading || !usage ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-container-high rounded w-2/3" />
            <div className="h-4 bg-surface-container-high rounded w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 요청 수 프로그레스 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-label-md text-on-surface-variant">
                  일일 요청 수
                </span>
                <span className="font-body text-label-md font-semibold text-on-surface">
                  {usage.todayCount.toLocaleString()} / {usage.dailyRequestLimit.toLocaleString()}
                  <span className="ml-1 text-on-surface-variant">({usage.requestPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usage.requestPercent >= 95
                      ? 'bg-red-500'
                      : usage.requestPercent >= 80
                        ? 'bg-amber-500'
                        : usage.requestPercent >= 50
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(usage.requestPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* 토큰 수 프로그레스 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-label-md text-on-surface-variant">
                  일일 토큰 수
                </span>
                <span className="font-body text-label-md font-semibold text-on-surface">
                  {usage.todayTotalTokens.toLocaleString()} /{' '}
                  {usage.dailyTokenLimit.toLocaleString()}
                  <span className="ml-1 text-on-surface-variant">({usage.tokenPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usage.tokenPercent >= 95
                      ? 'bg-red-500'
                      : usage.tokenPercent >= 80
                        ? 'bg-amber-500'
                        : usage.tokenPercent >= 50
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(usage.tokenPercent, 100)}%` }}
                />
              </div>
              <div className="flex gap-4 mt-1">
                <span className="font-body text-label-md text-on-surface-variant">
                  입력: {usage.todayInputTokens.toLocaleString()}
                </span>
                <span className="font-body text-label-md text-on-surface-variant">
                  출력: {usage.todayOutputTokens.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 오늘 발송된 알림 */}
            {usage.todayAlerts.length > 0 && (
              <div className="pt-3 border-t border-outline-variant/15">
                <span className="font-body text-label-md text-on-surface-variant">
                  오늘 발송된 알림:
                </span>
                <div className="flex gap-2 mt-1">
                  {usage.todayAlerts.map((a, i) => {
                    const cfg = LEVEL_CONFIG[a.level] ?? {
                      label: a.level,
                      color: 'text-on-surface-variant',
                    };
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center px-2 py-0.5 rounded font-body text-label-md font-medium ${cfg.color} bg-surface-container-high`}
                      >
                        {cfg.label} ({a.percent}%)
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 할당량 한도 설정 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="일일 요청 한도 (RPD)" desc="Gemini 무료 티어 기준 일일 최대 요청 수">
          <input
            type="number"
            min={1}
            value={settings.dailyRequestLimit ?? 1500}
            onChange={(e) => update('dailyRequestLimit', Number(e.target.value))}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FieldGroup>
        <FieldGroup label="일일 토큰 한도" desc="Gemini 무료 티어 기준 일일 최대 토큰 수">
          <input
            type="number"
            min={1}
            value={settings.dailyTokenLimit ?? 1000000}
            onChange={(e) => update('dailyTokenLimit', Number(e.target.value))}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FieldGroup>
      </div>

      {/* ── 임계값 설정 ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-body text-body-md font-semibold text-on-surface">알림 임계값</h3>
            <p className="font-body text-label-md text-on-surface-variant">
              할당량 대비 사용률이 임계값에 도달하면 Discord로 알림을 발송합니다.
            </p>
          </div>
          <button
            onClick={addThreshold}
            className="bg-primary-container text-on-primary rounded-lg px-4 py-2 font-body text-label-md font-semibold transition-colors"
          >
            + 추가
          </button>
        </div>

        <div className="space-y-3">
          {(settings.usageAlertThresholds || []).map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg"
            >
              {/* 퍼센트 입력 */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={t.percent}
                  onChange={(e) => updateThreshold(i, 'percent', Number(e.target.value))}
                  className="w-20 bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary text-center"
                />
                <span className="font-body text-body-md text-on-surface-variant">%</span>
              </div>

              {/* 레벨 선택 */}
              <select
                value={t.level}
                onChange={(e) => updateThreshold(i, 'level', e.target.value)}
                className="bg-surface-container-lowest rounded-lg px-3 py-2 border border-outline-variant/15 font-body text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="info">알림 (정보)</option>
                <option value="warning">경고</option>
                <option value="critical">위험</option>
              </select>

              {/* 레벨 뱃지 */}
              <span
                className={`inline-block w-3 h-3 rounded-full ${LEVEL_CONFIG[t.level]?.bg ?? 'bg-gray-400'}`}
              />

              {/* 삭제 */}
              <button
                onClick={() => removeThreshold(i)}
                className="ml-auto text-on-surface-variant hover:text-error transition-colors font-body text-label-md"
              >
                삭제
              </button>
            </div>
          ))}

          {(settings.usageAlertThresholds || []).length === 0 && (
            <div className="text-center py-6 text-on-surface-variant font-body text-body-md">
              설정된 알림 임계값이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* ── 자동 차단 설정 ── */}
      <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
        <div>
          <h3 className="font-semibold text-on-surface font-body text-body-md">
            100% 도달 시 자동 차단
          </h3>
          <p className="font-body text-label-md text-on-surface-variant">
            할당량 100%에 도달하면 AI 지시서 기능을 자동으로 비활성화합니다.
            <br />
            차단 후 어드민이 기본 설정 탭에서 수동으로 다시 활성화해야 합니다.
          </p>
        </div>
        <button
          onClick={() => update('autoDisableOnLimit', !(settings.autoDisableOnLimit ?? true))}
          className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-200 ${
            (settings.autoDisableOnLimit ?? true) ? 'bg-primary' : 'bg-surface-container-high'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              (settings.autoDisableOnLimit ?? true) ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* ── Discord Webhook 테스트 ── */}
      <div className="p-4 bg-surface-container-low rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-on-surface font-body text-body-md">
              Discord Webhook 테스트
            </h3>
            <p className="font-body text-label-md text-on-surface-variant">
              테스트 메시지를 전송하여 Discord 알림이 정상 동작하는지 확인합니다.
            </p>
          </div>
          <button
            onClick={handleTestAlert}
            disabled={testSending}
            className="bg-primary-container text-on-primary rounded-lg px-6 py-2.5 font-body text-body-md font-semibold disabled:opacity-40 transition-colors"
          >
            {testSending ? '전송 중...' : '테스트 전송'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 공통 필드 래퍼 ── */
function FieldGroup({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-body text-body-md font-semibold text-on-surface mb-1 block">
        {label}
      </label>
      <p className="font-body text-label-md text-on-surface-variant mb-2">{desc}</p>
      {children}
    </div>
  );
}
