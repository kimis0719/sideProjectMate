import { describe, it, expect, beforeEach } from 'vitest';
import { useModalStore } from '@/store/modalStore';

/**
 * useModal 훅 테스트
 *
 * useModal은 modalStore의 openConfirm/openAlert/close를 그대로 전달하는
 * 얇은 래퍼이므로, modalStore를 직접 호출하여 동작을 검증합니다.
 * (React 렌더링 없이 Zustand 스토어 직접 접근 패턴)
 */

const resetStore = () => {
  useModalStore.setState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: '확인',
    cancelText: '취소',
    isDestructive: false,
    closeOnBackdropClick: true,
    showCloseButton: true,
    resolve: () => {},
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
describe('useModal (via modalStore)', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    resetStore();
  });

  describe('confirm', () => {
    it('confirm()이 모달을 열고 사용자 응답을 Promise로 반환한다', async () => {
      const { openConfirm } = useModalStore.getState();
      const promise = openConfirm('삭제 확인', '정말 삭제하시겠습니까?', {
        confirmText: '삭제',
        isDestructive: true,
      });

      // 모달이 열림
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('confirm');
      expect(state.title).toBe('삭제 확인');
      expect(state.isDestructive).toBe(true);

      // 확인 클릭
      state.resolve(true);
      const result = await promise;
      expect(result).toBe(true);
    });

    it('취소 시 false를 반환한다', async () => {
      const promise = useModalStore.getState().openConfirm('확인', '계속?');
      useModalStore.getState().resolve(false);
      expect(await promise).toBe(false);
    });
  });

  describe('alert', () => {
    it('alert()이 모달을 열고 확인 시 resolve된다', async () => {
      const { openAlert } = useModalStore.getState();
      const promise = openAlert('완료', '저장되었습니다.');

      expect(useModalStore.getState().isOpen).toBe(true);
      expect(useModalStore.getState().type).toBe('alert');

      useModalStore.getState().resolve();
      await promise;
      expect(useModalStore.getState().isOpen).toBe(false);
    });
  });

  describe('close', () => {
    it('close()가 모달 상태를 초기화한다', () => {
      useModalStore.setState({
        isOpen: true,
        title: '열린 모달',
        isDestructive: true,
      });

      useModalStore.getState().close();

      const state = useModalStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.title).toBe('');
      expect(state.isDestructive).toBe(false);
    });
  });

  describe('isDestructive 옵션', () => {
    it('isDestructive 옵션이 올바르게 전달된다', () => {
      useModalStore.getState().openConfirm('경고', '삭제?', { isDestructive: true });
      expect(useModalStore.getState().isDestructive).toBe(true);
    });

    it('isDestructive 미지정 시 기본값 false이다', () => {
      useModalStore.getState().openConfirm('확인', '계속?');
      expect(useModalStore.getState().isDestructive).toBe(false);
    });
  });
});
