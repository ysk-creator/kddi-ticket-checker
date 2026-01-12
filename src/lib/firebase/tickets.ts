import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
    Ticket,
    CreateTicketData,
    UpdateTicketData,
    TicketStatus,
    TicketFilters,
    FirestoreTicket,
    User,
} from '@/types';

const TICKETS_COLLECTION = 'tickets';

// Convert Firestore document to Ticket
function convertFirestoreTicket(id: string, data: FirestoreTicket): Ticket {
    return {
        id,
        type: data.type,
        customerName: data.customerName,
        description: data.description,
        deadline: data.deadline.toDate(),
        assignedKddiId: data.assignedKddiId,
        assignedKddiEmail: data.assignedKddiEmail,
        createdBy: data.createdBy,
        status: data.status,
        comment: data.comment,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        completedAt: data.completedAt?.toDate(),
    };
}

// Create a new ticket
export async function createTicket(
    data: CreateTicketData,
    createdBy: string
): Promise<string> {
    const ticketData = {
        ...data,
        deadline: Timestamp.fromDate(data.deadline),
        createdBy,
        status: 'unconfirmed' as TicketStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), ticketData);
    return docRef.id;
}

// Update a ticket
export async function updateTicket(
    ticketId: string,
    data: UpdateTicketData
): Promise<void> {
    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    if (data.deadline) {
        updateData.deadline = Timestamp.fromDate(data.deadline);
    }

    // If status is being set to completed, record completedAt
    if (data.status === 'completed') {
        updateData.completedAt = serverTimestamp();
    }

    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), updateData);
}

// Update ticket status (for KDDI users)
export async function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    comment?: string
): Promise<void> {
    const updateData: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
    };

    if (comment !== undefined) {
        updateData.comment = comment;
    }

    if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
    }

    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), updateData);
}

// Get a single ticket by ID
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return convertFirestoreTicket(docSnap.id, docSnap.data() as FirestoreTicket);
}

// Get tickets with filters
export async function getTickets(
    filters: TicketFilters = {},
    user?: User
): Promise<Ticket[]> {
    let q = query(collection(db, TICKETS_COLLECTION), orderBy('createdAt', 'desc'));

    // Apply role-based filtering
    if (user) {
        if (user.role === 'kddi') {
            // KDDI users can only see tickets assigned to them
            q = query(
                collection(db, TICKETS_COLLECTION),
                where('assignedKddiId', '==', user.id),
                orderBy('createdAt', 'desc')
            );
        }
        // Sales and Admin can see all tickets
    }

    const querySnapshot = await getDocs(q);
    let tickets = querySnapshot.docs.map((doc) =>
        convertFirestoreTicket(doc.id, doc.data() as FirestoreTicket)
    );

    // Apply client-side filters
    if (filters.status && filters.status !== 'all') {
        if (filters.status === 'all_except_completed') {
            tickets = tickets.filter((t) => t.status !== 'completed');
        } else {
            tickets = tickets.filter((t) => t.status === filters.status);
        }
    }

    if (filters.type && filters.type !== 'all') {
        tickets = tickets.filter((t) => t.type === filters.type);
    }

    if (filters.assignedKddiId && filters.assignedKddiId !== 'all') {
        tickets = tickets.filter((t) => t.assignedKddiId === filters.assignedKddiId);
    }

    if (filters.overdueOnly) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tickets = tickets.filter(
            (t) => t.deadline < today && t.status !== 'completed'
        );
    }

    return tickets;
}

// Get overdue tickets (for notifications)
export async function getOverdueTickets(): Promise<Ticket[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, TICKETS_COLLECTION),
        where('status', '!=', 'completed'),
        orderBy('status'),
        orderBy('deadline', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs
        .map((doc) => convertFirestoreTicket(doc.id, doc.data() as FirestoreTicket))
        .filter((t) => t.deadline < today);

    return tickets;
}

// Delete a ticket
export async function deleteTicket(ticketId: string): Promise<void> {
    await deleteDoc(doc(db, TICKETS_COLLECTION, ticketId));
}

// Check if user can edit ticket
export function canEditTicket(ticket: Ticket, user: User): boolean {
    if (user.role === 'admin') {
        return true;
    }
    if (user.role === 'sales' && ticket.createdBy === user.id) {
        return true;
    }
    return false;
}

// Check if user can update ticket status
export function canUpdateStatus(user: User): boolean {
    return user.role === 'kddi';
}
