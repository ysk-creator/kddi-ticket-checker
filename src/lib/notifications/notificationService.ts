import { Ticket } from '@/types';
import { formatDate } from '@/lib/utils';

/**
 * Notification content interface
 */
export interface NotificationContent {
  subject: string;
  body: string;
  html: string;
}

/**
 * Notification channel interface - for future extensibility
 */
export interface NotificationChannel {
  name: string;
  send(recipient: string, content: NotificationContent): Promise<{
    success: boolean;
    error?: string;
  }>;
}

/**
 * Generate reminder notification content for overdue tickets
 */
export function generateOverdueReminderContent(
  recipientName: string,
  tickets: Ticket[]
): NotificationContent {
  const ticketList = tickets
    .map(
      (t) =>
        `・${t.customerName} - ${t.description} (期限: ${formatDate(t.deadline)})`
    )
    .join('\n');

  const ticketListHtml = tickets
    .map(
      (t) =>
        `<li><strong>${t.customerName}</strong> - ${t.description} (期限: ${formatDate(t.deadline)})</li>`
    )
    .join('');

  const subject = `【要対応】期限超過チケットのお知らせ (${tickets.length}件)`;

  const body = `
${recipientName} 様

以下のチケットが期限を超過しています。
早急にご対応をお願いいたします。

【期限超過チケット一覧】
${ticketList}

---
依頼チェッカー
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .ticket-list { background: white; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .ticket-list li { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .ticket-list li:last-child { border-bottom: none; }
    .footer { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
    .alert { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 20px;">依頼チェッカー</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">期限超過通知</p>
    </div>
    <div class="content">
      <p>${recipientName} 様</p>
      <div class="alert">
        <strong>⚠️ ${tickets.length}件のチケットが期限を超過しています</strong>
      </div>
      <p>以下のチケットについて、早急なご対応をお願いいたします。</p>
      <div class="ticket-list">
        <ul style="margin: 0; padding-left: 20px;">
          ${ticketListHtml}
        </ul>
      </div>
    </div>
    <div class="footer">
      依頼チェッカー｜このメールは自動送信されています
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, body, html };
}

/**
 * Placeholder for Plus Message channel (future implementation)
 */
export class PlusMessageChannel implements NotificationChannel {
  name = 'plus_message';

  async send(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _recipient: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement Plus Message integration
    console.log('Plus Message channel not yet implemented');
    return {
      success: false,
      error: 'Plus Message channel not yet implemented',
    };
  }
}
