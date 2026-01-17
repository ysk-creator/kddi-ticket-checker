import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/notifications/email';
import { generateOverdueReminderContent } from '@/lib/notifications/notificationService';
import { Ticket, TicketStatus, TicketType } from '@/types';

/**
 * Cron endpoint for sending reminder emails to partner users with overdue tickets
 * 
 * This endpoint should be called once a day at 9:00 AM JST
 * Can be triggered by:
 * - Vercel Cron
 * - Cloud Scheduler
 * - Manual HTTP request
 */
export async function POST() {
    try {
        const db = getAdminFirestore();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all tickets that are overdue and not completed
        const ticketsSnapshot = await db
            .collection('tickets')
            .where('status', '!=', 'completed')
            .get();

        const overdueTickets: Ticket[] = [];

        ticketsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const deadline = data.deadline.toDate();
            deadline.setHours(0, 0, 0, 0);

            if (deadline < today) {
                overdueTickets.push({
                    id: doc.id,
                    type: data.type as TicketType,
                    customerName: data.customerName,
                    description: data.description,
                    deadline: data.deadline.toDate(),
                    assignedPartnerId: data.assignedPartnerId,
                    assignedPartnerEmail: data.assignedPartnerEmail,
                    createdBy: data.createdBy,
                    status: data.status as TicketStatus,
                    comment: data.comment,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                    completedAt: data.completedAt?.toDate(),
                });
            }
        });

        if (overdueTickets.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No overdue tickets found',
                sentCount: 0,
            });
        }

        // Group tickets by assigned partner user
        const ticketsByUser = overdueTickets.reduce((acc, ticket) => {
            const userId = ticket.assignedPartnerId;
            if (!acc[userId]) {
                acc[userId] = {
                    email: ticket.assignedPartnerEmail,
                    tickets: [],
                };
            }
            acc[userId].tickets.push(ticket);
            return acc;
        }, {} as Record<string, { email: string; tickets: Ticket[] }>);

        const todayStr = today.toISOString().split('T')[0];
        const results: Array<{
            userId: string;
            email: string;
            ticketCount: number;
            success: boolean;
            error?: string;
        }> = [];

        // Send emails to each partner user
        for (const [userId, { email, tickets }] of Object.entries(ticketsByUser)) {
            // Check if already sent today (prevent duplicates)
            const existingLogSnapshot = await db
                .collection('notificationLogs')
                .where('recipientId', '==', userId)
                .where('sentDate', '==', todayStr)
                .limit(1)
                .get();

            if (!existingLogSnapshot.empty) {
                console.log(`Skipping ${email} - already sent today`);
                results.push({
                    userId,
                    email,
                    ticketCount: tickets.length,
                    success: false,
                    error: 'Already sent today',
                });
                continue;
            }

            // Get user display name
            const userDoc = await db.collection('users').doc(userId).get();
            const userName = userDoc.exists
                ? userDoc.data()?.displayName || email
                : email;

            // Generate email content
            const content = generateOverdueReminderContent(userName, tickets);

            // Send email
            const result = await sendEmail(email, {
                subject: content.subject,
                html: content.html,
                text: content.body,
            });

            // Log the notification
            await db.collection('notificationLogs').add({
                recipientId: userId,
                recipientEmail: email,
                ticketIds: tickets.map((t) => t.id),
                sentAt: new Date(),
                sentDate: todayStr,
                status: result.success ? 'success' : 'failed',
                error: result.error,
            });

            results.push({
                userId,
                email,
                ticketCount: tickets.length,
                success: result.success,
                error: result.error,
            });
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success && r.error !== 'Already sent today').length;

        return NextResponse.json({
            success: true,
            message: `Sent ${successCount} reminder emails, ${failCount} failed`,
            sentCount: successCount,
            results,
        });
    } catch (error) {
        console.error('Error in sendReminders:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Allow GET for testing
export async function GET() {
    return NextResponse.json({
        message: 'Use POST to trigger reminder emails',
        endpoint: '/api/cron/sendReminders',
    });
}
