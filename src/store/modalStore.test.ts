import { describe, it, expect, beforeEach } from 'vitest';
import { useModalStore } from './modalStore';

// ── 테스트 유틸 ──────────────────────────────────────────────────────
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
describe('modalStore', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    resetStore();
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('초기 상태', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('isOpen은 false이다', () => {
      expect(useModalStore.getState().isOpen).toBe(false);
    });

    it('type 기본값은 alert이다', () => {
      expect(useModalStore.getState().type).toBe('alert');
    });

    it('title은 빈 문자열이다', () => {
      expect(useModalStore.getState().title).toBe('');
    });

    it('confirmText 기본값은 확인이다', () => {
      expect(useModalStore.getState().confirmText).toBe('확인');
    });

    it('cancelText 기본값은 취소이다', () => {
      expect(useModalStore.getState().cancelText).toBe('취소');
    });

    it('isDestructive 기본값은 false이다', () => {
      expect(useModalStore.getState().isDestructive).toBe(false);
    });

    it('closeOnBackdropClick 기본값은 true이다', () => {
      expect(useModalStore.getState().closeOnBackdropClick).toBe(true);
    });

    it('showCloseButton 기본값은 true이다', () => {
      expect(useModalStore.getState().showCloseButton).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('openConfirm', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('모달을 confirm 타입으로 연다', () => {
      useModalStore.getState().openConfirm('제목', '메시지');
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('confirm');
      expect(state.title).toBe('제목');
      expect(state.message).toBe('메시지');
    });

    it('기본 옵션이 적용된다', () => {
      useModalStore.getState().openConfirm('제목', '메시지');
      const state = useModalStore.getState();
      expect(state.confirmText).toBe('확인');
      expect(state.cancelText).toBe('취소');
      expect(state.isDestructive).toBe(false);
    });

    it('커스텀 옵션이 적용된다', () => {
      useModalStore.getState().openConfirm('삭제', '정말?', {
        confirmText: '삭제',
        cancelText: '아니오',
        isDestructive: true,
        closeOnBackdropClick: false,
        showCloseButton: false,
      });
      const state = useModalStore.getState();
      expect(state.confirmText).toBe('삭제');
      expect(state.cancelText).toBe('아니오');
      expect(state.isDestructive).toBe(true);
      expect(state.closeOnBackdropClick).toBe(false);
      expect(state.showCloseButton).toBe(false);
    });

    it('Promise를 반환한다', () => {
      const result = useModalStore.getState().openConfirm('제목', '메시지');
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolve(true) 호출 시 Promise가 true로 resolve된다', async () => {
      const promise = useModalStore.getState().openConfirm('제목', '메시지');
      // 확인 버튼 클릭 시뮬레이션
      useModalStore.getState().resolve(true);
      const result = await promise;
      expect(result).toBe(true);
    });

    it('resolve(false) 호출 시 Promise가 false로 resolve된다', async () => {
      const promise = useModalStore.getState().openConfirm('제목', '메시지');
      // 취소 버튼 클릭 시뮬레이션
      useModalStore.getState().resolve(false);
      const result = await promise;
      expect(result).toBe(false);
    });

    it('resolve(null) 호출 시 Promise가 null로 resolve된다 (닫기/백드롭)', async () => {
      const promise = useModalStore.getState().openConfirm('제목', '메시지');
      useModalStore.getState().resolve(null);
      const result = await promise;
      expect(result).toBeNull();
    });

    it('resolve 후 모달이 닫힌다', async () => {
      const promise = useModalStore.getState().openConfirm('제목', '메시지');
      useModalStore.getState().resolve(true);
      await promise;
      expect(useModalStore.getState().isOpen).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('openAlert', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('모달을 alert 타입으로 연다', () => {
      useModalStore.getState().openAlert('알림', '저장되었습니다.');
      const state = useModalStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('alert');
      expect(state.title).toBe('알림');
      expect(state.message).toBe('저장되었습니다.');
    });

    it('기본 confirmText는 확인이다', () => {
      useModalStore.getState().openAlert('알림', '메시지');
      expect(useModalStore.getState().confirmText).toBe('확인');
    });

    it('커스텀 confirmText가 적용된다', () => {
      useModalStore.getState().openAlert('알림', '메시지', { confirmText: '닫기' });
      expect(useModalStore.getState().confirmText).toBe('닫기');
    });

    it('Promise를 반환한다', () => {
      const result = useModalStore.getState().openAlert('알림', '메시지');
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolve 호출 시 Promise가 resolve된다', async () => {
      const promise = useModalStore.getState().openAlert('알림', '메시지');
      useModalStore.getState().resolve();
      await promise;
      // resolve 후 모달이 닫혀야 한다
      expect(useModalStore.getState().isOpen).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('close', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('모달을 닫는다', () => {
      useModalStore.setState({ isOpen: true, title: '열림' });
      useModalStore.getState().close();
      expect(useModalStore.getState().isOpen).toBe(false);
    });

    it('title과 message를 초기화한다', () => {
      useModalStore.setState({ title: '제목', message: '내용' });
      useModalStore.getState().close();
      expect(useModalStore.getState().title).toBe('');
      expect(useModalStore.getState().message).toBe('');
    });

    it('옵션을 기본값으로 초기화한다', () => {
      useModalStore.setState({
        confirmText: '삭제',
        cancelText: '아니오',
        isDestructive: true,
        closeOnBackdropClick: false,
        showCloseButton: false,
      });
      useModalStore.getState().close();
      const state = useModalStore.getState();
      expect(state.confirmText).toBe('확인');
      expect(state.cancelText).toBe('취소');
      expect(state.isDestructive).toBe(false);
      expect(state.closeOnBackdropClick).toBe(true);
      expect(state.showCloseButton).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('연속 모달 시나리오', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('confirm 후 alert를 순차적으로 열 수 있다', async () => {
      // 1. confirm 열기
      const confirmPromise = useModalStore.getState().openConfirm('확인', '진행?');
      expect(useModalStore.getState().type).toBe('confirm');
      useModalStore.getState().resolve(true);
      const confirmResult = await confirmPromise;
      expect(confirmResult).toBe(true);

      // 2. alert 열기
      const alertPromise = useModalStore.getState().openAlert('완료', '저장됨');
      expect(useModalStore.getState().type).toBe('alert');
      useModalStore.getState().resolve();
      await alertPromise;
      expect(useModalStore.getState().isOpen).toBe(false);
    });

    it('isDestructive 옵션이 다음 모달에 누적되지 않는다', async () => {
      // 1. destructive confirm
      const p1 = useModalStore.getState().openConfirm('삭제', '정말?', { isDestructive: true });
      expect(useModalStore.getState().isDestructive).toBe(true);
      useModalStore.getState().resolve(true);
      await p1;

      // 2. 일반 confirm — isDestructive가 false여야 함
      useModalStore.getState().openConfirm('확인', '계속?');
      expect(useModalStore.getState().isDestructive).toBe(false);
    });
  });
});
