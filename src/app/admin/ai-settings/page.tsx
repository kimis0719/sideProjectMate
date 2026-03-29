import AiSettingsManager from '@/components/admin/AiSettingsManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI 지시서 설정' };

export default function AiSettingsPage() {
  return <AiSettingsManager />;
}
