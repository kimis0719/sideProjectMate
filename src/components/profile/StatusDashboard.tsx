'use client';

interface StatusDashboardProps {
    status?: string;
}

export default function StatusDashboard({ status = '구직중' }: StatusDashboardProps) {
    // 상태에 따른 색상 및 텍스트 매핑
    const getStatusStyle = (status: string) => {
        switch (status) {
            case '구직중':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case '재직중':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case '팀빌딩중':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
            default:
                return 'bg-muted text-foreground border-border';
        }
    };

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col justify-between">
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Current Status
                </h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-xl border ${getStatusStyle(status)}`}>
                    <span className="relative flex h-3 w-3 mr-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                    </span>
                    <span className="font-bold text-sm">{status}</span>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-muted-foreground">프로필 완성도</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">45%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    기술 스택과 시간표를 입력하여 완성도를 높여보세요!
                </p>
            </div>
        </div>
    );
}
