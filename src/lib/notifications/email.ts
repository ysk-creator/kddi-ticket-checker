import nodemailer from 'nodemailer';

export interface EmailContent {
    subject: string;
    html: string;
    text: string;
}

// SMTP transporter (configured via environment variables)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

/**
 * Send an email via SMTP
 */
export async function sendEmail(
    to: string,
    content: EmailContent
): Promise<{ success: boolean; error?: string }> {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@example.com',
            to,
            subject: content.subject,
            html: content.html,
            text: content.text,
        });

        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Test SMTP connection
 */
export async function testEmailConnection(): Promise<boolean> {
    try {
        await transporter.verify();
        return true;
    } catch (error) {
        console.error('SMTP connection test failed:', error);
        return false;
    }
}
