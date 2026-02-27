import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { INote } from '@/lib/models/kanban/NoteModel';
import type { IBoard } from '@/lib/models/kanban/BoardModel';
import type { ISection } from '@/lib/models/kanban/SectionModel';
import { socketClient } from '@/lib/socket';

export type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  boardId: string;
  sectionId?: string | null;
  tags: string[];
  dueDate?: Date;
  assigneeId?: string;
  creatorId?: string;
  updaterId?: string;
};

export type Board = {
  id: string;
  title: string;
  owner: string;
};

export type Section = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  boardId: string;
  color?: string;
  zIndex?: number;
};

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
const SEED_POS = { x: 120, y: 120 };
const OFFSET_STEP = 24;
const OFFSET_CYCLE = 8;

type BoardState = {
  boardId: string | null;
  pid: number | null;
  notes: Note[];
  sections: Section[];
  zoom: number;
  pan: { x: number; y: number };
  selectedNoteIds: string[];
  openPaletteNoteId: string | null;
  spawnIndex: number;
  nextColorIndex: number;
  members: Array<{ _id: string; nName: string; email: string; position?: string; role: string; avatarUrl?: string }>;
  alignmentGuides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[];
  lockedNotes: Record<string, { userId: string; socketId: string }>;
  lockedSections: Record<string, { userId: string; socketId: string }>;
  currentUserId: string | null;
  peerSelections: Record<string, { userId: string; color: string; socketId: string }[]>;
  activeUsers: Array<{ _id: string; nName: string; avatarUrl?: string; color?: string }>;
  isRemoteUpdate: boolean; // 원격 업데이트 여부를 나타내는 플래그 (Undo 히스토리 기록 제외용)

  // Actions
  initBoard: (pid: number) => Promise<void>;
  fetchMembers: (boardId: string) => Promise<void>;
  initSocket: (user?: { _id: string; nName: string; avatarUrl?: string }) => void;
  setCurrentUserId: (id: string) => void;
  addNote: (containerWidth?: number, containerHeight?: number) => Promise<void>;
  moveNote: (id: string, x: number, y: number) => void;
  moveNotes: (ids: string[], dx: number, dy: number) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  updateNotes: (updates: { id: string; changes: Partial<Note> }[]) => void;
  removeNote: (id: string) => Promise<void>;
  removeNotes: (ids: string[]) => Promise<void>;
  selectNote: (id: string | null, multi?: boolean) => void;
  selectNotes: (ids: string[]) => void;
  setOpenPaletteNoteId: (id: string | null) => void;
  duplicateNote: (id: string) => void;
  duplicateNotes: (ids: string[]) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  fitToContent: (containerWidth: number, containerHeight?: number) => void;
  setAlignmentGuides: (guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[]) => void;

  // Locking Actions
  lockNote: (noteId: string, userId: string) => void;
  unlockNote: (noteId: string) => void;
  lockSection: (sectionId: string, userId: string) => void;
  unlockSection: (sectionId: string) => void;
  setNoteLock: (noteId: string, info: { userId: string; socketId: string } | null) => void;

  // Section Actions
  addSection: (section: Section) => void;
  updateSection: (id: string, patch: Partial<Section>) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, x: number, y: number) => void;

  // Mobile/UX Logic
  isSnapEnabled: boolean;
  isSelectionMode: boolean;
  toggleSnap: () => void;
  toggleSelectionMode: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Remote-only Actions (Internal use by socket listeners)
  applyRemoteNoteCreation: (note: Note) => void;
  applyRemoteNoteUpdate: (note: Note) => void;
  applyRemoteNoteDeletion: (noteId: string) => void;
  applyRemoteSectionCreation: (section: Section) => void;
  applyRemoteSectionUpdate: (section: Section) => void;
  applyRemoteSectionDeletion: (sectionId: string) => void;
  applyRemoteBoardSync: (data: { notes: Note[]; sections: Section[] }) => void;
  setActiveUsers: (users: Array<{ _id: string; nName: string; avatarUrl?: string; color?: string }>) => void;
};

const transformDoc = (doc: any) => {
  const { _id, ...rest } = JSON.parse(JSON.stringify(doc));
  return { id: _id || doc.id, ...rest };
};

export const useBoardStore = create<BoardState>()(
  devtools(
    temporal(
      (set, get) => ({
        notes: [],
        sections: [],
        members: [],
        boardId: null,
        pid: null,
        scale: 1,
        pan: { x: 0, y: 0 },
        zoom: 1,
        selectedNoteIds: [],
        openPaletteNoteId: null,
        spawnIndex: 0,
        nextColorIndex: 0,
        alignmentGuides: [],
        lockedNotes: {},
        lockedSections: {},
        currentUserId: null,
        peerSelections: {},
        activeUsers: [],
        isSnapEnabled: false,
        isSelectionMode: false,
        isRemoteUpdate: false,

        setActiveUsers: (users) => set({ activeUsers: users }),

        toggleSnap: () => set((state) => ({ isSnapEnabled: !state.isSnapEnabled })),
        toggleSelectionMode: () => set((state) => ({ isSelectionMode: !state.isSelectionMode })),

        initBoard: async (pid) => {
          set({ notes: [], sections: [], boardId: null, selectedNoteIds: [], members: [], pid });
          try {
            // 1. Board ID 조회
            const boardRes = await fetch(`/api/kanban/boards?pid=${pid}`);
            if (!boardRes.ok) throw new Error('Failed to fetch board');
            const boardJson = await boardRes.json();
            const board = transformDoc(boardJson.data);
            set({ boardId: board.id });

            // 2. 노트 조회
            const notesRes = await fetch(`/api/kanban/notes?boardId=${board.id}`);
            if (notesRes.ok) {
              const notesJson = await notesRes.json();
              const noteList = notesJson.data || [];
              const parsedNotes = noteList.map((n: any) => ({
                ...n,
                id: n._id,
                tags: n.tags || [],
                dueDate: n.dueDate ? new Date(n.dueDate) : undefined,
                assigneeId: n.assigneeId || undefined,
                creatorId: n.creatorId,
                updaterId: n.updaterId
              }));
              set({ notes: parsedNotes });
            }

            // 3. 섹션 조회
            const sectionsRes = await fetch(`/api/kanban/sections?boardId=${board.id}`);
            if (sectionsRes.ok) {
              const sectionDocs = await sectionsRes.json();
              if (sectionDocs.success) {
                const sections = sectionDocs.data.map(transformDoc);
                set({ sections });
              }
            }

            // 초기화 직후 히스토리 비우기
            useBoardStore.temporal.getState().clear();

            // 4. 멤버 및 보드 데이터 관련 추가 정보 초기화
            get().fetchMembers(board.id);

          } catch (error) {
            console.error(error);
            set({ notes: [], sections: [], boardId: null });
          }
        },

        fetchMembers: async (boardId) => {
          try {
            const res = await fetch(`/api/kanban/boards/${boardId}/members`);
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                set({ members: data.members });
              }
            }
          } catch (error) {
            console.error('Failed to fetch members:', error);
          }
        },
        setCurrentUserId: (id) => set({ currentUserId: id }),

        initSocket: (userInfo) => {
          const { boardId } = get();
          if (!boardId) return;

          const socket = socketClient.connect();
          // [긴급 복구] 기존 서버 로직과의 호환성을 위해 boardId를 문자열로 직접 전송
          socket.emit('join-board', boardId);

          // Presence 기록을 위해 유저 정보가 있다면 별도 알림 (서버 지원 시)
          if (userInfo) {
            socket.emit('user-activity', { boardId, user: userInfo });
          }


          // Note Events
          socket.off('note-created');
          socket.on('note-created', (note: any) => {
            get().applyRemoteNoteCreation(transformDoc(note));
          });

          socket.off('note-updated');
          socket.on('note-updated', (note: any) => {
            get().applyRemoteNoteUpdate(transformDoc(note));
          });

          socket.off('note-deleted');
          socket.on('note-deleted', (noteId: string) => {
            get().applyRemoteNoteDeletion(noteId);
          });

          socket.off('notes-deleted-batch');
          socket.on('notes-deleted-batch', (noteIds: string[]) => {
            noteIds.forEach(noteId => get().applyRemoteNoteDeletion(noteId));
          });

          // Lock Events
          socket.off('note-locked');
          socket.on('note-locked', (data: { id: string; userId: string; socketId: string }) => {
            set(state => ({
              lockedNotes: { ...state.lockedNotes, [data.id]: { userId: data.userId, socketId: data.socketId } }
            }));
          });

          socket.off('note-unlocked');
          socket.on('note-unlocked', (data: { id: string }) => {
            set(state => {
              const newLocked = { ...state.lockedNotes };
              delete newLocked[data.id];
              return { lockedNotes: newLocked };
            });
          });

          socket.off('section-locked');
          socket.on('section-locked', (data: { id: string; userId: string; socketId: string }) => {
            set(state => ({
              lockedSections: { ...state.lockedSections, [data.id]: { userId: data.userId, socketId: data.socketId } }
            }));
          });

          socket.off('section-unlocked');
          socket.on('section-unlocked', (data: { id: string }) => {
            set(state => {
              const newLocked = { ...state.lockedSections };
              delete newLocked[data.id];
              return { lockedSections: newLocked };
            });
          });

          // Section Events
          socket.off('section-created');
          socket.on('section-created', (section: any) => {
            get().applyRemoteSectionCreation(transformDoc(section));
          });

          socket.off('section-updated');
          socket.on('section-updated', (section: any) => {
            get().applyRemoteSectionUpdate(transformDoc(section));
          });

          socket.off('section-deleted');
          socket.on('section-deleted', (sectionId: string) => {
            get().applyRemoteSectionDeletion(sectionId);
          });

          // Peer Selection
          socket.off('note-selected');
          socket.on('note-selected', (data: { noteIds: string[]; userId: string; color: string; socketId: string }) => {
            set((state) => {
              const newPeerSelections = { ...state.peerSelections };
              Object.keys(newPeerSelections).forEach(key => {
                newPeerSelections[key] = newPeerSelections[key].filter(s => s.socketId !== data.socketId);
                if (newPeerSelections[key].length === 0) delete newPeerSelections[key];
              });
              data.noteIds.forEach(id => {
                if (!newPeerSelections[id]) newPeerSelections[id] = [];
                newPeerSelections[id].push({ userId: data.userId, color: data.color, socketId: data.socketId });
              });
              return { peerSelections: newPeerSelections };
            });
          });

          socket.off('note-deselected');
          socket.on('note-deselected', (data: { userId: string; socketId: string }) => {
            set((state) => {
              const newPeerSelections = { ...state.peerSelections };
              Object.keys(newPeerSelections).forEach(key => {
                newPeerSelections[key] = newPeerSelections[key].filter(s => s.socketId !== data.socketId);
                if (newPeerSelections[key].length === 0) delete newPeerSelections[key];
              });
              return { peerSelections: newPeerSelections };
            });
          });

          // [Undo/Redo Sync]
          socket.off('board-synced');
          socket.on('board-synced', (data: { notes: Note[], sections: Section[] }) => {
            get().applyRemoteBoardSync(data);
          });

          // Presence Events
          socket.off('board-users-update');
          socket.on('board-users-update', (users: any[]) => {
            get().setActiveUsers(users);
          });
        },

        addNote: async (containerWidth?: number, containerHeight?: number) => {
          const { spawnIndex, nextColorIndex, notes, boardId, sections, pan, zoom } = get();
          if (!boardId) return;

          let x = SEED_POS.x + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
          let y = SEED_POS.y + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;

          if (containerWidth && containerHeight) {
            const centerX = containerWidth / 2;
            const centerY = containerHeight / 2;
            x = (centerX - pan.x) / zoom - (OFFSET_STEP * 2);
            y = (centerY - pan.y) / zoom - (OFFSET_STEP * 2);
            x += (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
            y += (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
          }

          const NOTE_W = 200;
          const NOTE_H = 140;
          const centerX = x + NOTE_W / 2;
          const centerY = y + NOTE_H / 2;

          const containingSection = sections.find(
            (s) =>
              centerX >= s.x &&
              centerX <= s.x + s.width &&
              centerY >= s.y &&
              centerY <= s.y + s.height
          );

          const optimisticNote: Omit<Note, 'id'> & { id: string | null } = {
            id: `temp-${crypto.randomUUID()}`,
            x,
            y,
            width: NOTE_W,
            height: NOTE_H,
            text: '새 노트',
            color: COLOR_PALETTE[nextColorIndex % COLOR_PALETTE.length],
            boardId: boardId as any,
            sectionId: containingSection ? (containingSection.id as any) : null,
            tags: [],
          };

          set((state) => ({
            notes: [...state.notes, optimisticNote as Note],
            spawnIndex: state.spawnIndex + 1,
            nextColorIndex: state.nextColorIndex + 1,
            selectedNoteIds: [optimisticNote.id!],
          }));

          try {
            const response = await fetch('/api/kanban/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...optimisticNote, boardId }),
            });
            if (!response.ok) throw new Error('Failed to save note');
            const savedNoteJson = await response.json();
            const savedNote = transformDoc(savedNoteJson.data);

            set((state) => ({
              notes: state.notes.map((n) => (n.id === optimisticNote.id ? savedNote : n)),
              selectedNoteIds: [savedNote.id],
            }));

            const socket = socketClient.connect();
            socket.emit('create-note', { boardId, note: savedNote });

          } catch (error) {
            console.error(error);
            set({ notes });
          }
        },

        removeNote: async (id) => {
          const { boardId } = get();
          const originalNotes = get().notes;
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
            selectedNoteIds: state.selectedNoteIds.filter((sid) => sid !== id),
          }));

          try {
            const response = await fetch(`/api/kanban/notes/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete note');

            if (boardId) {
              const socket = socketClient.connect();
              socket.emit('delete-note', { boardId, noteId: id });
            }
          } catch (error) {
            console.error(error);
            set({ notes: originalNotes });
          }
        },

        removeNotes: async (ids) => {
          const { boardId } = get();
          const originalNotes = get().notes;
          set((state) => ({
            notes: state.notes.filter((n) => !ids.includes(n.id)),
            selectedNoteIds: state.selectedNoteIds.filter((sid) => !ids.includes(sid)),
          }));

          try {
            const response = await fetch('/api/kanban/notes/batch-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ noteIds: ids, boardId }),
            });
            if (!response.ok) throw new Error('Failed to batch delete notes');

            if (boardId) {
              const socket = socketClient.connect();
              socket.emit('delete-notes-batch', { boardId, noteIds: ids });
            }
          } catch (error) {
            console.error(error);
            set({ notes: originalNotes });
          }
        },

        duplicateNote: (id) => {
          const { notes, boardId } = get();
          if (!boardId) return;

          const targetNote = notes.find((n) => n.id === id);
          if (targetNote) {
            const newId = `temp-${crypto.randomUUID()}`;
            const newNote: Note = {
              ...targetNote,
              id: newId,
              x: targetNote.x + 20,
              y: targetNote.y + 20,
              boardId,
              tags: [...targetNote.tags],
              dueDate: targetNote.dueDate,
              assigneeId: targetNote.assigneeId
            };

            set((state) => ({
              notes: [...state.notes, newNote],
              selectedNoteIds: [newId]
            }));

            fetch('/api/kanban/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: newNote.text,
                x: newNote.x,
                y: newNote.y,
                color: newNote.color,
                width: newNote.width,
                height: newNote.height,
                boardId: newNote.boardId,
                sectionId: newNote.sectionId,
                tags: newNote.tags,
                dueDate: newNote.dueDate,
                assigneeId: newNote.assigneeId,
              }),
            })
              .then(res => res.json())
              .then(json => {
                if (json?.success && json.data) {
                  const savedNote = json.data;
                  set(state => ({
                    notes: state.notes.map(n => n.id === newId ? { ...savedNote, id: savedNote._id } : n),
                    selectedNoteIds: [savedNote._id]
                  }));
                }
              })
              .catch(console.error);
          }
        },

        duplicateNotes: (ids) => {
          const { duplicateNote } = get();
          ids.forEach(id => duplicateNote(id));
        },

        moveNote: (id, x, y) => set((state) => {
          const { boardId } = get();
          const targetNote = state.notes.find((n) => n.id === id);
          if (!targetNote) return state;

          const NOTE_W = targetNote.width || 200;
          const NOTE_H = targetNote.height || 140;
          const centerX = x + NOTE_W / 2;
          const centerY = y + NOTE_H / 2;

          const containingSection = state.sections.find(
            (s) =>
              centerX >= s.x &&
              centerX <= s.x + s.width &&
              centerY >= s.y &&
              centerY <= s.y + s.height
          );

          const updatedNote = { ...targetNote, x, y, sectionId: containingSection ? containingSection.id : null };

          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('update-note', { boardId, note: updatedNote });
          }

          return {
            notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
          };
        }),

        moveNotes: (ids, dx, dy) => set((state) => {
          const { boardId } = get();
          const updatedNotes = state.notes
            .filter((n) => ids.includes(n.id))
            .map((n) => ({
              ...n,
              x: n.x + dx,
              y: n.y + dy,
            }));

          if (boardId && updatedNotes.length > 0) {
            const socket = socketClient.connect();
            updatedNotes.forEach(updatedNote => {
              socket.emit('update-note', { boardId, note: updatedNote });
            })
          }

          return {
            notes: state.notes.map((n) =>
              ids.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
            )
          }
        }),

        updateNote: (id, patch) => {
          const { boardId } = get();
          set((state) => {
            const targetNote = state.notes.find((n) => n.id === id);
            if (!targetNote) return state;
            const updatedNote = { ...targetNote, ...patch };

            if (boardId) {
              const socket = socketClient.connect();
              socket.emit('update-note', { boardId, note: updatedNote });
            }

            // Notification Logic for Assignee
            if (patch.assigneeId) {
              const { currentUserId, pid } = get();
              if (currentUserId && patch.assigneeId !== currentUserId) {
                // API Call to create notification
                fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipientId: patch.assigneeId,
                    type: 'assign_note',
                    projectPid: pid,
                    metadata: { noteId: id }
                  })
                }).catch(err => console.error('Failed to send notification:', err));

                // Socket Emit
                if (boardId) {
                  const socket = socketClient.connect();
                  socket.emit('send-notification', {
                    targetUserId: patch.assigneeId,
                    type: 'assign_note',
                    projectPid: pid,
                    noteId: id
                  });
                }
              }
            }

            return {
              notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
            };
          });
        },

        updateNotes: async (updates) => {
          const { boardId } = get();
          set((state) => {
            const newNotes = [...state.notes];
            updates.forEach(({ id, changes }) => {
              const idx = newNotes.findIndex((n) => n.id === id);
              if (idx !== -1) {
                newNotes[idx] = { ...newNotes[idx], ...changes };

                if (boardId) {
                  const socket = socketClient.connect();
                  socket.emit('update-note', { boardId, note: newNotes[idx] });
                }
              }
            });
            return { notes: newNotes };
          });

          try {
            const response = await fetch('/api/kanban/notes/batch', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates }),
            });
            if (!response.ok) throw new Error('Failed to batch update notes');
          } catch (error) {
            console.error(error);
          }
        },

        selectNote: (id, multi) =>
          set((state) => {
            let newSelectedIds: string[];
            if (!id) {
              newSelectedIds = [];
            } else if (multi) {
              newSelectedIds = state.selectedNoteIds.includes(id)
                ? state.selectedNoteIds.filter((sid) => sid !== id)
                : [...state.selectedNoteIds, id];
            } else {
              newSelectedIds = [id];
            }

            const { boardId, currentUserId } = get();
            if (boardId && currentUserId) {
              const socket = socketClient.connect();
              if (newSelectedIds.length > 0) {
                let hash = 0;
                for (let i = 0; i < currentUserId.length; i++) {
                  hash = currentUserId.charCodeAt(i) + ((hash << 5) - hash);
                }
                const c = (hash & 0x00ffffff).toString(16).toUpperCase();
                const color = '#' + '00000'.substring(0, 6 - c.length) + c;

                socket.emit('select-note', { boardId, noteIds: newSelectedIds, userId: currentUserId, color });
              } else {
                socket.emit('deselect-note', { boardId, userId: currentUserId });
              }
            }

            return { selectedNoteIds: newSelectedIds };
          }),

        selectNotes: (ids) => {
          set({ selectedNoteIds: ids });
          const { boardId, currentUserId } = get();
          if (boardId && currentUserId) {
            const socket = socketClient.connect();
            if (ids.length > 0) {
              let hash = 0;
              for (let i = 0; i < currentUserId.length; i++) {
                hash = currentUserId.charCodeAt(i) + ((hash << 5) - hash);
              }
              const c = (hash & 0x00ffffff).toString(16).toUpperCase();
              const color = '#' + '00000'.substring(0, 6 - c.length) + c;

              socket.emit('select-note', { boardId, noteIds: ids, userId: currentUserId, color });
            } else {
              socket.emit('deselect-note', { boardId, userId: currentUserId });
            }
          }
        },
        setOpenPaletteNoteId: (id) => set({ openPaletteNoteId: id }),
        setZoom: (z) => set({ zoom: z }),
        setPan: (x, y) => set({ pan: { x, y } }),

        fitToContent: (containerWidth: number, containerHeight?: number) => {
          // containerHeight가 없으면 현재 창 높이 또는 임의 값 사용 (방어 코드)
          const safeContainerHeight = containerHeight || 800;

          const { notes, sections } = get();
          if (notes.length === 0 && sections.length === 0) {
            set({ zoom: 1, pan: { x: 0, y: 0 } });
            return;
          }

          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

          notes.forEach((n) => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + (n.width || 200));
            maxY = Math.max(maxY, n.y + (n.height || 140));
          });

          sections.forEach((s) => {
            minX = Math.min(minX, s.x);
            minY = Math.min(minY, s.y);
            maxX = Math.max(maxX, s.x + s.width);
            maxY = Math.max(maxY, s.y + s.height);
          });

          const PADDING = 100;
          const contentW = maxX - minX + PADDING * 2;
          const contentH = maxY - minY + PADDING * 2;

          const scaleX = containerWidth / contentW;
          const scaleY = safeContainerHeight / contentH;
          let newZoom = Math.min(scaleX, scaleY);
          newZoom = Math.min(Math.max(newZoom, 0.1), 1.5);

          const contentCenterX = (minX + maxX) / 2;
          const contentCenterY = (minY + maxY) / 2;

          const newPanX = -contentCenterX * newZoom + containerWidth / 2;
          const newPanY = -contentCenterY * newZoom + safeContainerHeight / 2;

          set({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
        },

        setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),

        addSection: (section) => {
          const { boardId } = get();
          set((state) => ({ sections: [...state.sections, section] }));

          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('create-section', { boardId, section });
          }
        },

        updateSection: (id, patch) => {
          const { boardId } = get();
          set((state) => {
            const targetSection = state.sections.find(s => s.id === id);
            if (!targetSection) return state;
            const updatedSection = { ...targetSection, ...patch };

            if (boardId) {
              const socket = socketClient.connect();
              socket.emit('update-section', { boardId, section: updatedSection });
            }

            return {
              sections: state.sections.map((s) => (s.id === id ? updatedSection : s)),
            };
          });
        },

        removeSection: (id) => {
          const { boardId } = get();
          set((state) => ({ sections: state.sections.filter((s) => s.id !== id) }));

          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('delete-section', { boardId, sectionId: id });
          }
        },

        moveSection: (id, x, y) => {
          const { boardId, sections, notes } = get();
          const section = sections.find((s) => s.id === id);
          if (!section) return;

          const dx = x - section.x;
          const dy = y - section.y;

          if (dx === 0 && dy === 0) return;

          const updatedSection = { ...section, x, y };
          const newSections = sections.map((s) => (s.id === id ? updatedSection : s));

          // 섹션 내 노트들을 함께 이동
          const affectedNotes: Note[] = [];
          const newNotes = notes.map((n) => {
            if (n.sectionId?.toString() === id) {
              const updatedNote = { ...n, x: n.x + dx, y: n.y + dy };
              affectedNotes.push(updatedNote);
              return updatedNote;
            }
            return n;
          });

          set({ sections: newSections, notes: newNotes });

          // 실시간 브로드캐스트 (변경된 항목만)
          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('update-section', { boardId, section: updatedSection });
            affectedNotes.forEach(note => {
              socket.emit('update-note', { boardId, note });
            });
          }
        },

        lockNote: (noteId, userId) => {
          const { boardId } = get();
          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('request-lock', { boardId, id: noteId, type: 'note', userId });
          }
        },

        unlockNote: (noteId) => {
          const { boardId } = get();
          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('release-lock', { boardId, id: noteId, type: 'note' });
          }
        },

        lockSection: (sectionId, userId) => {
          const { boardId } = get();
          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('request-lock', { boardId, id: sectionId, type: 'section', userId });
          }
        },

        unlockSection: (sectionId) => {
          const { boardId } = get();
          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('release-lock', { boardId, id: sectionId, type: 'section' });
          }
        },

        setNoteLock: (noteId, info) => {
          set(state => {
            const newLocked = { ...state.lockedNotes };
            if (info) {
              newLocked[noteId] = info;
            } else {
              delete newLocked[noteId];
            }
            return { lockedNotes: newLocked };
          });
        },

        undo: () => {
          const { notes: oldNotes, sections: oldSections, boardId } = get();
          useBoardStore.temporal.getState().undo();
          const { notes: newNotes, sections: newSections } = get();

          if (!boardId) return;
          const socket = socketClient.connect();

          // 1. 변경된 노트들만 식별하여 전송 (Differential Sync)
          newNotes.forEach(note => {
            const oldNote = oldNotes.find(on => on.id === note.id);
            // 과거 스냅샷과 현재가 다르면 해당 노트만 전송
            if (!oldNote || JSON.stringify(oldNote) !== JSON.stringify(note)) {
              socket.emit('update-note', { boardId, note });
            }
          });

          // 2. Undo로 인해 다시 생겨난 노트 (원래 삭제했었으나 Undo)
          newNotes.forEach(note => {
            if (!oldNotes.find(on => on.id === note.id)) {
              socket.emit('create-note', { boardId, note });
            }
          });

          // 3. Undo로 인해 사라진 노트 (원래 생성했었으나 Undo)
          oldNotes.forEach(oldNote => {
            if (!newNotes.find(n => n.id === oldNote.id)) {
              socket.emit('delete-note', { boardId, noteId: oldNote.id });
            }
          });

          // 4. 변경된 섹션 동기화
          newSections.forEach(section => {
            const oldSection = oldSections.find(os => os.id === section.id);
            if (!oldSection || JSON.stringify(oldSection) !== JSON.stringify(section)) {
              socket.emit('update-section', { boardId, section });
            }
          });

          // 5. Undo로 인해 다시 생겨난 섹션
          newSections.forEach(section => {
            if (!oldSections.find(os => os.id === section.id)) {
              socket.emit('create-section', { boardId, section });
            }
          });

          // 6. Undo로 인해 사라진 섹션
          oldSections.forEach(oldSection => {
            if (!newSections.find(s => s.id === oldSection.id)) {
              socket.emit('delete-section', { boardId, sectionId: oldSection.id });
            }
          });
        },

        redo: () => {
          const { notes: oldNotes, sections: oldSections, boardId } = get();
          useBoardStore.temporal.getState().redo();
          const { notes: newNotes, sections: newSections } = get();

          if (!boardId) return;
          const socket = socketClient.connect();

          // Undo와 동일한 로직으로 변경된 페이로드만 전송
          newNotes.forEach(note => {
            const oldNote = oldNotes.find(on => on.id === note.id);
            if (!oldNote || JSON.stringify(oldNote) !== JSON.stringify(note)) {
              socket.emit('update-note', { boardId, note });
            }
          });

          // Redo로 인해 다시 생겨난 노트
          newNotes.forEach(note => {
            if (!oldNotes.find(on => on.id === note.id)) {
              socket.emit('create-note', { boardId, note });
            }
          });

          // Redo로 인해 사라진 노트
          oldNotes.forEach(oldNote => {
            if (!newNotes.find(n => n.id === oldNote.id)) {
              socket.emit('delete-note', { boardId, noteId: oldNote.id });
            }
          });

          // 변경된 섹션 동기화
          newSections.forEach(section => {
            const oldSection = oldSections.find(os => os.id === section.id);
            if (!oldSection || JSON.stringify(oldSection) !== JSON.stringify(section)) {
              socket.emit('update-section', { boardId, section });
            }
          });

          // Redo로 인해 다시 생겨난 섹션
          newSections.forEach(section => {
            if (!oldSections.find(os => os.id === section.id)) {
              socket.emit('create-section', { boardId, section });
            }
          });

          // Redo로 인해 사라진 섹션
          oldSections.forEach(oldSection => {
            if (!newSections.find(s => s.id === oldSection.id)) {
              socket.emit('delete-section', { boardId, sectionId: oldSection.id });
            }
          });
        },

        // --- Remote-only Actions Implementation ---
        applyRemoteNoteCreation: (note) => {
          const { notes } = get();
          if (!notes.find((n) => n.id === note.id)) {
            // 1. 현재 상태 업데이트 (기록 제외)
            useBoardStore.temporal.getState().pause();
            set({ notes: [...notes, note] });
            useBoardStore.temporal.getState().resume();

            // 2. 히스토리 주입 (모든 히스토리에 새 노트 추가)
            // 내가 과거로 가더라도 새로 생성된 노트는 존재해야 함
            const { pastStates, futureStates } = useBoardStore.temporal.getState();
            const inject = (s: any) => ({ ...s, notes: [...s.notes, note] });
            (useBoardStore.temporal as any).setState({
              pastStates: pastStates.map(inject),
              futureStates: futureStates.map(inject)
            });
          }
        },

        applyRemoteNoteUpdate: (note) => {
          // 1. 현재 상태 업데이트 (기록 제외)
          useBoardStore.temporal.getState().pause();
          set((state) => ({
            notes: state.notes.map((n) => n.id === note.id ? { ...n, ...note } : n)
          }));
          useBoardStore.temporal.getState().resume();

          // 2. 히스토리 주입 (모든 과거/미래 스냅샷의 해당 노트 정보를 최신으로 업데이트)
          const { pastStates, futureStates } = useBoardStore.temporal.getState();
          const patch = (s: any) => ({
            ...s,
            notes: s.notes.map((n: any) => n.id === note.id ? { ...n, ...note } : n)
          });
          (useBoardStore.temporal as any).setState({
            pastStates: pastStates.map(patch),
            futureStates: futureStates.map(patch)
          });
        },

        applyRemoteNoteDeletion: (noteId) => {
          // 1. 현재 상태 업데이트 (기록 제외)
          useBoardStore.temporal.getState().pause();
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== noteId)
          }));
          useBoardStore.temporal.getState().resume();

          // 2. 히스토리 주입 (모든 스냅샷에서 삭제)
          const { pastStates, futureStates } = useBoardStore.temporal.getState();
          const filter = (s: any) => ({ ...s, notes: s.notes.filter((n: any) => n.id !== noteId) });
          (useBoardStore.temporal as any).setState({
            pastStates: pastStates.map(filter),
            futureStates: futureStates.map(filter)
          });
        },

        applyRemoteSectionCreation: (section) => {
          const { sections } = get();
          if (!sections.find((s) => s.id === section.id)) {
            useBoardStore.temporal.getState().pause();
            set({ sections: [...sections, section] });
            useBoardStore.temporal.getState().resume();

            const { pastStates, futureStates } = useBoardStore.temporal.getState();
            const inject = (s: any) => ({ ...s, sections: [...s.sections, section] });
            (useBoardStore.temporal as any).setState({
              pastStates: pastStates.map(inject),
              futureStates: futureStates.map(inject)
            });
          }
        },

        applyRemoteSectionUpdate: (section) => {
          useBoardStore.temporal.getState().pause();
          set((state) => ({
            sections: state.sections.map((s) => s.id === section.id ? { ...s, ...section } : s)
          }));
          useBoardStore.temporal.getState().resume();

          const { pastStates, futureStates } = useBoardStore.temporal.getState();
          const patch = (s: any) => ({
            ...s,
            sections: s.sections.map((sec: any) => sec.id === section.id ? { ...sec, ...section } : sec)
          });
          (useBoardStore.temporal as any).setState({
            pastStates: pastStates.map(patch),
            futureStates: futureStates.map(patch)
          });
        },

        applyRemoteSectionDeletion: (sectionId) => {
          useBoardStore.temporal.getState().pause();
          set((state) => ({
            sections: state.sections.filter((s) => s.id !== sectionId)
          }));
          useBoardStore.temporal.getState().resume();

          const { pastStates, futureStates } = useBoardStore.temporal.getState();
          const filter = (s: any) => ({ ...s, sections: s.sections.filter((s: any) => s.id !== sectionId) });
          (useBoardStore.temporal as any).setState({
            pastStates: pastStates.map(filter),
            futureStates: futureStates.map(filter)
          });
        },

        applyRemoteBoardSync: (data) => {
          const syncedNotes = data.notes.map((n: any) => ({
            ...n,
            dueDate: n.dueDate ? new Date(n.dueDate) : undefined
          }));
          useBoardStore.temporal.getState().pause();
          set({
            notes: syncedNotes,
            sections: data.sections
          });
          useBoardStore.temporal.getState().resume();

          // 전체 동기화의 경우 히스토리를 덮어쓰거나 무시할 수 있으나, 
          // 안전을 위해 히스토리를 비우거나 최신으로 보정하는 전략 선택
          // 여기서는 모든 히스토리 스냅샷에 동기화된 데이터를 일단 주입
          const { pastStates, futureStates } = useBoardStore.temporal.getState();
          const sync = () => ({ notes: syncedNotes, sections: data.sections });
          (useBoardStore.temporal as any).setState({
            pastStates: pastStates.map(sync),
            futureStates: futureStates.map(sync)
          });
        }
      }),
      {
        limit: 50,
        handleSet: (handleSet) => (state) => {
          // pause/resume을 사용하므로 여기서의 추가 필터는 보조적으로 유지하거나 제거 가능
          if ((state as any).isRemoteUpdate) return;
          handleSet(state);
        },
        partialize: (state) => ({
          notes: state.notes,
          sections: state.sections
        }),
        equality: (pastState, currentState) => {
          // notes와 sections의 변화를 심층 비교하되, height 변화는 무시
          // 1. Sections 비교 (단순 JSON Stringify or depth check)
          const sectionsChanged = JSON.stringify(pastState.sections) !== JSON.stringify(currentState.sections);
          if (sectionsChanged) return false; // 다르면 저장 (false = 저장)

          // 2. Notes 비교
          if (pastState.notes.length !== currentState.notes.length) return false;

          // 길이가 같으면 각 노트 비교
          const isDifferent = pastState.notes.some((pastNote, index) => {
            const currentNote = currentState.notes[index];
            // 다른 필드가 하나라도 다르면 true (저장해야 함)
            // height만 다르고 나머지가 같으면 false (저장 안 함 -> 결과적으로 전체가 '같다'고 판단)

            // id 체크 (순서가 바뀌었을 수도 있으므로 id로 매칭하는게 안전하지만, 여기선 인덱스 매칭 가정하자니 위험할 수 있음. 
            // 하지만 보통 순서는 안바뀜. zundo equality는 전체 state 비교임.)

            // 더 안전한 방법: 
            if (pastNote.id !== currentNote.id) return true; // 다름

            // 비교할 키 목록 (height 제외)
            const keys = Object.keys(pastNote) as Array<keyof Note>;

            for (const key of keys) {
              if (key === 'height') continue; // 높이 변화 무시
              if (pastNote[key] !== currentNote[key]) {
                // Date 객체 비교
                if (pastNote[key] instanceof Date && currentNote[key] instanceof Date) {
                  if ((pastNote[key] as Date).getTime() !== (currentNote[key] as Date).getTime()) return true;
                } else {
                  return true; // 다른게 있음
                }
              }
            }
            return false; // 이 노트는 (height 빼고) 같다
          });

          return !isDifferent; // 다르지 않으면(같으면) true 반환 -> 저장 안 함
        }
      }
    )
  )
);
