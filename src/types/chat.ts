import { ChatCategory } from '@/constants/chat';

export interface IChatParticipant {
  _id: string;
  nName?: string;
  avatarUrl?: string;
}

export interface IChatRoomClient {
  _id: string;
  category: ChatCategory;
  participants: IChatParticipant[];
  lastMessage?: string;
  updatedAt: string;
  createdAt?: string;
  projectId?: string;
  applicationId?: string;
  metadata?: Record<string, any>;
  /** STEP 2에서 API 보강 후 채워짐 */
  myUnreadCount?: number;
  /** STEP 2에서 API 보강 후 채워짐 (TEAM/INQUIRY 카테고리) */
  projectName?: string;
}

export interface IChatMessageClient {
  _id: string;
  roomId: string;
  sender: string | { _id: string; nName?: string; avatarUrl?: string };
  content: string;
  messageType?: string;
  readBy?: string[];
  createdAt: string;
}
