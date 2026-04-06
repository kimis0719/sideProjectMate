import AdminAuditLog from '@/lib/models/AdminAuditLog';

interface AuditLogParams {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  detail?: string;
  ip?: string;
}

/**
 * 관리자 액션 감사 로그를 비동기로 저장합니다.
 * fire-and-forget — API 응답을 블로킹하지 않습니다.
 * 로그 저장 실패 시 console.error만 출력합니다.
 */
export function logAdminAction(params: AuditLogParams): void {
  AdminAuditLog.create({
    adminId: params.adminId,
    adminEmail: params.adminEmail,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetLabel: params.targetLabel || '',
    detail: params.detail || '',
    ip: params.ip || 'unknown',
  })
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('[AUDIT LOG]', params.action, params.targetType, params.targetId);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[AUDIT LOG ERROR]', params, err);
    });
}

/**
 * NextRequest에서 IP 주소를 추출합니다.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
