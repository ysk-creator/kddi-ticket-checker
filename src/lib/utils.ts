import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Check if a date is overdue (past today)
export function isOverdue(deadline: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Format date to Japanese localized string
export function formatDateJP(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

// Calculate days between two dates
export function daysBetween(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay));
}
