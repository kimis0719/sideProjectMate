import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getSocket } from '@/lib/socket';

interface Member {
  _id: string;
  nName?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}

interface MemberWidgetProps {
  members: Member[];
  currentUserId: string;
  projectId: string;
}

export default function MemberWidget({ members, currentUserId, projectId }: MemberWidgetProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();

    // 1. 이미 들어와 있는 유저들에게 "나 여기 있어" 알림 (필요시)
    // 사실 join-project 시 서버가 broadcast 해주므로, 여기선 수신만 하면 됨.

    // 내 아이디는 항상 온라인으로 간주할 수도 있지만, 소켓 연결이 끊기면 오프라인 처리되는 게 맞음.
    // 하지만 UX상 "나"는 항상 온라인으로 보이는 게 자연스러움.
    setOnlineUserIds((prev) => new Set(prev).add(currentUserId));

    // 이벤트 핸들러: 누군가 들어왔음
    const handleMemberOnline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
    };

    // 이벤트 핸들러: 누군가 나갔음
    const handleMemberOffline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    socket.on('member-online', handleMemberOnline);
    socket.on('member-offline', handleMemberOffline);

    return () => {
      socket.off('member-online', handleMemberOnline);
      socket.off('member-offline', handleMemberOffline);
    };
  }, [currentUserId]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full">
      <h3 className="font-semibold font-headline text-on-surface mb-6 flex items-center justify-between">
        팀원
        <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant">
          {members.length}
        </span>
      </h3>

      <ul className="space-y-4">
        {members.map((member) => {
          const isOnline = onlineUserIds.has(member._id) || member._id === currentUserId;
          const displayName =
            member.nName || member.name || member.email?.split('@')[0] || 'Unknown';
          const initial = displayName[0].toUpperCase();

          return (
            <li key={member._id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant overflow-hidden">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-surface-container-lowest rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-surface-container-high'}`}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-on-surface">{displayName}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                    {member.role || 'Member'}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {members.length === 0 && (
        <div className="text-sm text-on-surface-variant/50 py-4 text-center">팀원이 없습니다.</div>
      )}
    </div>
  );
}
