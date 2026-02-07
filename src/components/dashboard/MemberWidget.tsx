import { useEffect, useState } from 'react';
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
        setOnlineUserIds(prev => new Set(prev).add(currentUserId));

        // 이벤트 핸들러: 누군가 들어왔음
        const handleMemberOnline = ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
        };

        // 이벤트 핸들러: 누군가 나갔음
        const handleMemberOffline = ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => {
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 h-full">
            <h3 className="font-semibold mb-3 flex items-center justify-between dark:text-slate-100">
                팀원 <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-slate-400">{members.length}</span>
            </h3>

            <ul className="space-y-3">
                {members.map((member) => {
                    const isOnline = onlineUserIds.has(member._id) || member._id === currentUserId; // 나 자신은 항상 온라인
                    const displayName = member.nName || member.name || member.email?.split('@')[0] || 'Unknown';
                    const initial = displayName[0].toUpperCase();

                    return (
                        <li key={member._id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                {/* 아바타 */}
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                        {member.image ? (
                                            <img src={member.image} alt={displayName} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            initial
                                        )}
                                    </div>
                                    {/* 온라인 상태 점 */}
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                </div>

                                {/* 이름 및 역할 */}
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{displayName}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{member.role || 'Member'}</p>
                                </div>
                            </div>

                            {/* 상태 텍스트 (호버 시 표시 등) */}
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isOnline ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' : 'text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-500'}`}>
                                {isOnline ? 'ON' : 'OFF'}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {members.length === 0 && (
                <div className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">
                    팀원이 없습니다.
                </div>
            )}
        </div>
    );
}
