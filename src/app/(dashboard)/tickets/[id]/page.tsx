'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    getTicketById,
    updateTicket,
    updateTicketStatus,
    canEditTicket,
    canUpdateStatus,
    deleteTicket,
    getUserById,
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    TicketStatus,
    TicketType,
    TICKET_STATUS_LABELS,
    TICKET_TYPE_LABELS,
    User,
} from '@/types';
import { isOverdue, formatDate, formatDateJP } from '@/lib/utils';
import {
    ArrowLeft,
    Save,
    Trash2,
    AlertTriangle,
    Calendar,
    User as UserIcon,
    Clock,
} from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [creator, setCreator] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [editForm, setEditForm] = useState({
        type: '' as TicketType,
        customerName: '',
        description: '',
        deadline: '',
    });

    const [statusForm, setStatusForm] = useState({
        status: '' as TicketStatus,
        comment: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ticketData = await getTicketById(id);

                if (!ticketData) {
                    router.push('/tickets');
                    return;
                }

                setTicket(ticketData);

                // Set initial form values
                setEditForm({
                    type: ticketData.type,
                    customerName: ticketData.customerName,
                    description: ticketData.description,
                    deadline: formatDate(ticketData.deadline),
                });

                setStatusForm({
                    status: ticketData.status,
                    comment: ticketData.comment || '',
                });

                // Fetch creator details
                const creatorData = await getUserById(ticketData.createdBy);
                setCreator(creatorData);
            } catch (error) {
                console.error('Error fetching ticket:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    const handleSaveEdit = async () => {
        if (!ticket || !user) return;

        setSaving(true);
        try {
            await updateTicket(ticket.id, {
                type: editForm.type,
                customerName: editForm.customerName,
                description: editForm.description,
                deadline: new Date(editForm.deadline),
            });

            // Refresh ticket data
            const updatedTicket = await getTicketById(ticket.id);
            if (updatedTicket) {
                setTicket(updatedTicket);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('チケットの更新に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!ticket || !user) return;

        setSaving(true);
        try {
            await updateTicketStatus(ticket.id, statusForm.status, statusForm.comment);

            // Refresh ticket data
            const updatedTicket = await getTicketById(ticket.id);
            if (updatedTicket) {
                setTicket(updatedTicket);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('ステータスの更新に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!ticket || !user) return;

        if (!confirm('このチケットを削除しますか？')) return;

        try {
            await deleteTicket(ticket.id);
            router.push('/tickets');
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('チケットの削除に失敗しました');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">チケットが見つかりませんでした</p>
                <Link href="/tickets" className="text-purple-600 hover:underline mt-4 block">
                    チケット一覧に戻る
                </Link>
            </div>
        );
    }

    const overdue = isOverdue(ticket.deadline) && ticket.status !== 'completed';
    const canEdit = user ? canEditTicket(ticket, user) : false;
    const canStatus = user ? canUpdateStatus(user) : false;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/tickets">
                        <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            戻る
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">チケット詳細</h1>
                </div>
                {canEdit && !isEditing && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="border-gray-300 text-gray-600 hover:bg-gray-100"
                            onClick={() => setIsEditing(true)}
                        >
                            編集
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            削除
                        </Button>
                    </div>
                )}
            </div>

            {/* Status Alert */}
            {overdue && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    <div>
                        <p className="text-red-600 font-semibold">期限超過</p>
                        <p className="text-red-500 text-sm">
                            このチケットは期限を超過しています。早急に対応が必要です。
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-gray-900">チケット情報</CardTitle>
                            <div className="flex gap-2">
                                <Badge
                                    variant={
                                        ticket.status === 'completed'
                                            ? 'success'
                                            : ticket.status === 'rejected'
                                                ? 'destructive'
                                                : 'default'
                                    }
                                >
                                    {TICKET_STATUS_LABELS[ticket.status]}
                                </Badge>
                                <Badge variant="outline">{TICKET_TYPE_LABELS[ticket.type]}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isEditing ? (
                                // Edit Form
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-700">種別</Label>
                                            <Select
                                                value={editForm.type}
                                                onValueChange={(value: TicketType) =>
                                                    setEditForm((prev) => ({ ...prev, type: value }))
                                                }
                                            >
                                                <SelectTrigger className="bg-white border-gray-300">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                    {Object.entries(TICKET_TYPE_LABELS).map(
                                                        ([value, label]) => (
                                                            <SelectItem key={value} value={value}>
                                                                {label}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-700">期限</Label>
                                            <Input
                                                type="date"
                                                value={editForm.deadline}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        deadline: e.target.value,
                                                    }))
                                                }
                                                className="bg-white border-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">顧客名</Label>
                                        <Input
                                            value={editForm.customerName}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    customerName: e.target.value,
                                                }))
                                            }
                                            className="bg-white border-gray-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">依頼内容</Label>
                                        <Textarea
                                            value={editForm.description}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    description: e.target.value,
                                                }))
                                            }
                                            rows={4}
                                            className="bg-white border-gray-300"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            className="border-gray-300 text-gray-600"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            キャンセル
                                        </Button>
                                        <Button
                                            className="bg-purple-600 hover:bg-purple-700"
                                            onClick={handleSaveEdit}
                                            disabled={saving}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {saving ? '保存中...' : '保存'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                // View Mode
                                <>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            {ticket.customerName}
                                        </h3>
                                        <p className="text-gray-600 mt-2">{ticket.description}</p>
                                    </div>
                                    {ticket.comment && (
                                        <div className="bg-gray-100 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-1">コメント</p>
                                            <p className="text-gray-900">{ticket.comment}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Update (Partner only) */}
                    {canStatus && (
                        <Card className="bg-white border-gray-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-gray-900">ステータス更新</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">ステータス</Label>
                                    <Select
                                        value={statusForm.status}
                                        onValueChange={(value: TicketStatus) =>
                                            setStatusForm((prev) => ({ ...prev, status: value }))
                                        }
                                    >
                                        <SelectTrigger className="bg-white border-gray-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200">
                                            {Object.entries(TICKET_STATUS_LABELS).map(
                                                ([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">
                                        コメント（任意、差し戻し時は理由を記入）
                                    </Label>
                                    <Textarea
                                        value={statusForm.comment}
                                        onChange={(e) =>
                                            setStatusForm((prev) => ({
                                                ...prev,
                                                comment: e.target.value,
                                            }))
                                        }
                                        rows={3}
                                        placeholder="コメントを入力..."
                                        className="bg-white border-gray-300 placeholder:text-gray-400"
                                    />
                                </div>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={handleStatusUpdate}
                                    disabled={saving}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? '更新中...' : 'ステータスを更新'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-white border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-900 text-lg">詳細情報</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">期限</p>
                                    <p className={`text-gray-900 ${overdue ? 'text-red-500' : ''}`}>
                                        {formatDateJP(ticket.deadline)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">作成者</p>
                                    <p className="text-gray-900">
                                        {creator?.displayName || '不明'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">作成日時</p>
                                    <p className="text-gray-900">{formatDateJP(ticket.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">最終更新</p>
                                    <p className="text-gray-900">{formatDateJP(ticket.updatedAt)}</p>
                                </div>
                            </div>
                            {ticket.completedAt && (
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">完了日時</p>
                                        <p className="text-green-600">
                                            {formatDateJP(ticket.completedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
