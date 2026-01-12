'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getTickets } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TicketStatus,
    TICKET_STATUS_LABELS,
    DashboardStats,
} from '@/types';
import { isOverdue, daysBetween } from '@/lib/utils';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    ListTodo,
} from 'lucide-react';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/tickets');
            return;
        }

        const fetchStats = async () => {
            if (!user) return;

            try {
                const tickets = await getTickets({}, user);

                // Calculate stats
                const overdueCount = tickets.filter(
                    (t) => isOverdue(t.deadline) && t.status !== 'completed'
                ).length;

                const statusCounts = tickets.reduce((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1;
                    return acc;
                }, {} as Record<TicketStatus, number>);

                // Fill in missing statuses with 0
                const allStatuses: TicketStatus[] = [
                    'unconfirmed',
                    'confirmed',
                    'pending_approval',
                    'rejected',
                    'completed',
                ];
                allStatuses.forEach((status) => {
                    if (!statusCounts[status]) {
                        statusCounts[status] = 0;
                    }
                });

                // Calculate average lead time for completed tickets
                const completedTickets = tickets.filter(
                    (t) => t.status === 'completed' && t.completedAt
                );
                const averageLeadTimeDays =
                    completedTickets.length > 0
                        ? completedTickets.reduce(
                            (sum, t) =>
                                sum + daysBetween(t.createdAt, t.completedAt as Date),
                            0
                        ) / completedTickets.length
                        : 0;

                setStats({
                    overdueCount,
                    statusCounts,
                    averageLeadTimeDays: Math.round(averageLeadTimeDays * 10) / 10,
                    totalCount: tickets.length,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 text-gray-500">
                データを読み込めませんでした
            </div>
        );
    }

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'rejected':
                return 'bg-red-500';
            case 'pending_approval':
                return 'bg-yellow-500';
            case 'confirmed':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
                <p className="text-gray-500">チケット全体の状況を俯瞰できます</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">総チケット数</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalCount}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <ListTodo className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-sm border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">期限超過</p>
                                <p className="text-3xl font-bold text-red-500">
                                    {stats.overdueCount}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">完了件数</p>
                                <p className="text-3xl font-bold text-green-500">
                                    {stats.statusCounts.completed || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">平均リードタイム</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {stats.averageLeadTimeDays}
                                    <span className="text-lg text-gray-500 ml-1">日</span>
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Breakdown */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        ステータス別内訳
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(TICKET_STATUS_LABELS).map(([status, label]) => {
                            const count = stats.statusCounts[status as TicketStatus] || 0;
                            const percentage =
                                stats.totalCount > 0
                                    ? Math.round((count / stats.totalCount) * 100)
                                    : 0;

                            return (
                                <div key={status} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`${getStatusColor(status as TicketStatus)} text-white`}
                                            >
                                                {label}
                                            </Badge>
                                        </div>
                                        <div className="text-gray-900 font-medium">
                                            {count}件 ({percentage}%)
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getStatusColor(status as TicketStatus)} transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Info */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">通知について</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600">
                    <p>
                        期限を超過したチケットについては、毎朝9:00に自動でリマインドメールが送信されます。
                    </p>
                    <p className="mt-2">
                        手動で通知を送信する場合は、以下のAPIエンドポイントを呼び出してください：
                    </p>
                    <code className="block mt-2 bg-gray-100 p-3 rounded text-sm text-purple-600">
                        POST /api/cron/sendReminders
                    </code>
                </CardContent>
            </Card>
        </div>
    );
}
