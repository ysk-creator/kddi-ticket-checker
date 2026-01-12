'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { USER_ROLE_LABELS } from '@/types';
import { Home, ListTodo, BarChart3, LogOut, User } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const navItems = [
        { href: '/tickets', label: 'チケット一覧', icon: ListTodo },
        ...(user.role === 'admin'
            ? [{ href: '/admin', label: 'ダッシュボード', icon: BarChart3 }]
            : []),
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/tickets" className="flex items-center gap-2">
                                <Home className="h-6 w-6 text-purple-600" />
                                <span className="text-xl font-bold text-gray-900">
                                    依頼チェッカー
                                </span>
                            </Link>
                            <nav className="hidden md:flex items-center gap-4">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                                                ? 'bg-purple-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <User className="h-4 w-4" />
                                <span className="text-sm">
                                    {user.displayName}
                                    <span className="text-gray-400 ml-2">
                                        ({USER_ROLE_LABELS[user.role]})
                                    </span>
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                ログアウト
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    );
}
