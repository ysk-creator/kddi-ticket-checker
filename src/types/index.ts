// User roles
export type UserRole = 'sales' | 'admin' | 'kddi';

// Ticket status - 5 stages
export type TicketStatus =
  | 'unconfirmed'      // 未確認（初期）
  | 'confirmed'        // 確認済み（DL/内容確認）
  | 'pending_approval' // 上司申請中
  | 'rejected'         // 差し戻し（追加情報待ち）
  | 'completed';       // 完了

// Ticket type categories
export type TicketType = 'negotiation' | 'approval' | 'other';

// Status labels in Japanese
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  unconfirmed: '未確認',
  confirmed: '確認済み',
  pending_approval: '社内申請中',
  rejected: '差し戻し',
  completed: '完了',
};

// Type labels in Japanese
export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  negotiation: '相対',
  approval: '稟議',
  other: 'その他',
};

// Role labels in Japanese
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  sales: '営業',
  admin: '管理者',
  kddi: 'KDDI担当',
};

// Ticket interface
export interface Ticket {
  id: string;
  type: TicketType;
  customerName: string;
  description: string;
  deadline: Date;
  assignedKddiId: string;
  assignedKddiEmail: string;
  createdBy: string;
  status: TicketStatus;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Ticket data for creation (without id and timestamps)
export interface CreateTicketData {
  type: TicketType;
  customerName: string;
  description: string;
  deadline: Date;
  assignedKddiId: string;
  assignedKddiEmail: string;
}

// Ticket data for update
export interface UpdateTicketData {
  type?: TicketType;
  customerName?: string;
  description?: string;
  deadline?: Date;
  assignedKddiId?: string;
  assignedKddiEmail?: string;
  status?: TicketStatus;
  comment?: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  createdAt: Date;
}

// Notification log interface
export interface NotificationLog {
  id: string;
  recipientId: string;
  recipientEmail: string;
  ticketIds: string[];
  sentAt: Date;
  status: 'success' | 'failed';
  error?: string;
}

// Filter options for ticket list
export interface TicketFilters {
  status?: TicketStatus | 'all' | 'all_except_completed';
  type?: TicketType | 'all';
  assignedKddiId?: string | 'all';
  overdueOnly?: boolean;
}

// Dashboard statistics
export interface DashboardStats {
  overdueCount: number;
  statusCounts: Record<TicketStatus, number>;
  averageLeadTimeDays: number;
  totalCount: number;
}

// Firestore document converters
export interface FirestoreTicket {
  type: TicketType;
  customerName: string;
  description: string;
  deadline: { toDate: () => Date };
  assignedKddiId: string;
  assignedKddiEmail: string;
  createdBy: string;
  status: TicketStatus;
  comment?: string;
  createdAt: { toDate: () => Date };
  updatedAt: { toDate: () => Date };
  completedAt?: { toDate: () => Date };
}

export interface FirestoreUser {
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  createdAt: { toDate: () => Date };
}
