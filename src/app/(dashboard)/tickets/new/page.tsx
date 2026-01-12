'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createTicket } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TicketType, TICKET_TYPE_LABELS } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewTicketPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'negotiation' as TicketType,
        customerName: '',
        description: '',
        deadline: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await createTicket(
                {
                    type: formData.type,
                    customerName: formData.customerName,
                    description: formData.description,
                    deadline: new Date(formData.deadline),
                    assignedKddiId: '', // Single KDDI user - will be assigned automatically
                    assignedKddiEmail: '',
                },
                user.id
            );

            router.push('/tickets');
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('チケットの作成に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (user?.role === 'kddi') {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">チケット作成権限がありません</p>
                <Link href="/tickets" className="text-purple-600 hover:underline mt-4 block">
                    チケット一覧に戻る
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/tickets">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        戻る
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">新規チケット作成</h1>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">チケット情報</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-gray-700">
                                    種別 <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: TicketType) =>
                                        setFormData((prev) => ({ ...prev, type: value }))
                                    }
                                >
                                    <SelectTrigger className="bg-white border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-gray-200">
                                        {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline" className="text-gray-700">
                                    期限 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                                    }
                                    required
                                    className="bg-white border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customerName" className="text-gray-700">
                                顧客名 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customerName"
                                value={formData.customerName}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                                }
                                required
                                placeholder="例：株式会社○○"
                                className="bg-white border-gray-300 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-gray-700">
                                依頼内容 <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                required
                                placeholder="依頼内容を入力してください"
                                rows={4}
                                className="bg-white border-gray-300 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link href="/tickets">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-gray-300 text-gray-600 hover:bg-gray-100"
                                >
                                    キャンセル
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700"
                                disabled={loading}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? '作成中...' : '作成'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
