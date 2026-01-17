import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/notifications/email';
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from '@/types';

/**
 * API endpoint for sending notification email when ticket status is updated
 * Called from client-side after status update
 */
export async function POST(request: NextRequest) {
    try {
        const { ticketId, newStatus, updatedBy, comment } = await request.json();

        if (!ticketId || !newStatus || !updatedBy) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const db = getAdminFirestore();

        // Get ticket data
        const ticketDoc = await db.collection('tickets').doc(ticketId).get();
        if (!ticketDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        const ticketData = ticketDoc.data()!;
        const creatorId = ticketData.createdBy;

        // Don't send notification if updater is the creator
        if (updatedBy === creatorId) {
            return NextResponse.json({
                success: true,
                message: 'No notification needed - updater is the creator',
            });
        }

        // Get creator user data
        const creatorDoc = await db.collection('users').doc(creatorId).get();
        if (!creatorDoc.exists) {
            return NextResponse.json({
                success: false,
                error: 'Creator user not found',
            });
        }

        const creatorData = creatorDoc.data()!;
        const creatorEmail = creatorData.email;
        const creatorName = creatorData.displayName || creatorEmail;

        // Get updater user data
        const updaterDoc = await db.collection('users').doc(updatedBy).get();
        const updaterName = updaterDoc.exists
            ? updaterDoc.data()?.displayName || '担当者'
            : '担当者';

        // Generate email content
        const statusLabel = TICKET_STATUS_LABELS[newStatus as keyof typeof TICKET_STATUS_LABELS] || newStatus;
        const typeLabel = TICKET_TYPE_LABELS[ticketData.type as keyof typeof TICKET_TYPE_LABELS] || ticketData.type;
        const deadline = ticketData.deadline.toDate().toLocaleDateString('ja-JP');

        const subject = `【ステータス更新】${ticketData.customerName} - ${typeLabel}`;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">チケットのステータスが更新されました</h2>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>お客様名:</strong> ${ticketData.customerName}</p>
                    <p><strong>種別:</strong> ${typeLabel}</p>
                    <p><strong>期日:</strong> ${deadline}</p>
                    <p><strong>新しいステータス:</strong> <span style="color: #7c3aed; font-weight: bold;">${statusLabel}</span></p>
                    <p><strong>更新者:</strong> ${updaterName}</p>
                    ${comment ? `<p><strong>コメント:</strong> ${comment}</p>` : ''}
                </div>
                
                <p>詳細は依頼チェッカーで確認してください。</p>
            </div>
        `;

        const text = `
チケットのステータスが更新されました

お客様名: ${ticketData.customerName}
種別: ${typeLabel}
期日: ${deadline}
新しいステータス: ${statusLabel}
更新者: ${updaterName}
${comment ? `コメント: ${comment}` : ''}

詳細は依頼チェッカーで確認してください。
        `;

        // Send email
        const result = await sendEmail(creatorEmail, {
            subject,
            html,
            text,
        });

        // Log notification
        await db.collection('notificationLogs').add({
            type: 'status_update',
            recipientId: creatorId,
            recipientEmail: creatorEmail,
            ticketIds: [ticketId],
            sentAt: new Date(),
            status: result.success ? 'success' : 'failed',
            error: result.error,
            metadata: {
                newStatus,
                updatedBy,
            },
        });

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? `Notification sent to ${creatorEmail}`
                : `Failed to send notification: ${result.error}`,
        });
    } catch (error) {
        console.error('Error in notifyStatusUpdate:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
