'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getTickets } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Ticket,
    TicketFilters,
    TicketStatus,
    TicketType,
    TICKET_STATUS_LABELS,
    TICKET_TYPE_LABELS,
} from '@/types';
import { isOverdue, formatDate } from '@/lib/utils';
import { Plus, AlertTriangle, Calendar } from 'lucide-react';

export default function TicketsPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TicketFilters>({
        status: 'all_except_completed',
        type: 'all',
        overdueOnly: false,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const ticketsData = await getTickets(filters, user);
                setTickets(ticketsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, filters]);

    const handleFilterChange = (key: keyof TicketFilters, value: string | boolean) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const getStatusBadgeVariant = (status: TicketStatus) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'rejected':
                return 'destructive';
            case 'pending_approval':
                return 'warning';
            case 'confirmed':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const getTypeBadgeVariant = (type: TicketType) => {
        switch (type) {
            case 'negotiation':
                return 'default';
            case 'approval':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const overdueCount = tickets.filter(
        (t) => isOverdue(t.deadline) && t.status !== 'completed'
    ).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">チケット一覧</h1>
                    <p className="text-gray-500">
                        全{tickets.length}件
                        {overdueCount > 0 && (
                            <span className="text-red-500 ml-2">
                                （期限超過: {overdueCount}件）
                            </span>
                        )}
                    </p>
                </div>
                {(user?.role === 'sales' || user?.role === 'admin') && (
                    <Link href="/tickets/new">
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-4 w-4 mr-2" />
                            新規チケット
                        </Button>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">フィルター</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-gray-600 mb-2 block">
                                ステータス
                            </label>
                            <Select
                                value={filters.status || 'all_except_completed'}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger className="bg-white border-gray-300">
                                    <SelectValue placeholder="すべて（完了除く）" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    <SelectItem value="all_except_completed">
                                        すべて（完了除く）
                                    </SelectItem>
                                    <SelectItem value="all">
                                        すべて
                                    </SelectItem>
                                    {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 mb-2 block">種別</label>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => handleFilterChange('type', value)}
                            >
                                <SelectTrigger className="bg-white border-gray-300">
                                    <SelectValue placeholder="すべて" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    <SelectItem value="all">
                                        すべて
                                    </SelectItem>
                                    {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant={filters.overdueOnly ? 'destructive' : 'outline'}
                                className={
                                    filters.overdueOnly
                                        ? ''
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                }
                                onClick={() =>
                                    handleFilterChange('overdueOnly', !filters.overdueOnly)
                                }
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                期限超過のみ
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ticket List */}
            <div className="space-y-4">
                {tickets.length === 0 ? (
                    <Card className="bg-white border-gray-200">
                        <CardContent className="py-12 text-center text-gray-500">
                            チケットが見つかりませんでした
                        </CardContent>
                    </Card>
                ) : (
                    tickets.map((ticket) => {
                        const overdue = isOverdue(ticket.deadline) && ticket.status !== 'completed';

                        return (
                            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                                <Card
                                    className={`bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm ${overdue ? 'border-l-4 border-l-red-500' : ''
                                        }`}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={getTypeBadgeVariant(ticket.type)}>
                                                        {TICKET_TYPE_LABELS[ticket.type]}
                                                    </Badge>
                                                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                                                        {TICKET_STATUS_LABELS[ticket.status]}
                                                    </Badge>
                                                    {overdue && (
                                                        <Badge variant="destructive" className="animate-pulse">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            期限超過
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {ticket.customerName}
                                                </h3>
                                                <p className="text-gray-500 text-sm line-clamp-1">
                                                    {ticket.description}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 text-sm text-gray-500 md:text-right">
                                                <div className="flex items-center gap-1 md:justify-end">
                                                    <Calendar className="h-4 w-4" />
                                                    <span className={overdue ? 'text-red-500' : ''}>
                                                        期限: {formatDate(ticket.deadline)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
