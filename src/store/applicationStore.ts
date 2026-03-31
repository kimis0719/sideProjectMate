import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

interface ApplicationEntry {
  applicationId: string;
  status: ApplicationStatus;
}

interface ApplicationState {
  myApplications: Record<string, ApplicationEntry>;
  loaded: boolean;
}

interface ApplicationActions {
  fetchMyApplications: () => Promise<void>;
  addApplication: (projectId: string, applicationId: string) => void;
  withdrawApplication: (projectId: string) => void;
  getStatus: (projectId: string) => ApplicationEntry | null;
}

export const useApplicationStore = create<ApplicationState & ApplicationActions>()(
  devtools(
    (set, get) => ({
      myApplications: {},
      loaded: false,

      fetchMyApplications: async () => {
        try {
          const res = await fetch('/api/applications/my');
          const data = await res.json();
          if (data.success) {
            set({ myApplications: data.data, loaded: true });
          }
        } catch (error) {
          console.error('[applicationStore] fetch failed:', error);
        }
      },

      addApplication: (projectId, applicationId) => {
        set((state) => ({
          myApplications: {
            ...state.myApplications,
            [projectId]: { applicationId, status: 'pending' },
          },
        }));
      },

      withdrawApplication: (projectId) => {
        set((state) => {
          const next = { ...state.myApplications };
          delete next[projectId];
          return { myApplications: next };
        });
      },

      getStatus: (projectId) => {
        return get().myApplications[projectId] ?? null;
      },
    }),
    { name: 'applicationStore' }
  )
);
