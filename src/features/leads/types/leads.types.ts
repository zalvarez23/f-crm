export type LeadStatus = 'new' | 'contacted' | 'interested' | 'closed' | 'lost'

export type LeadType = 'loan' | 'investment'

export interface Lead {
    id?: string
    name: string
    phone: string
    email?: string | null
    amount: number
    status: 'nuevo' | 'contactado' | 'contacto_no_efectivo' | 'no_contactado' | 'rechazado'
    substatus?: 'interesado' | 'gestion_whatsapp' | 'inversionista' | 'agendado_potencial' | 'cita' | 'seguimiento' | 'en_validacion' | 'aprobado' |
                'no_califica' | 'prestamo_menos_15000' | 'consiguio_prestamo' | 'no_interesado' | 'llamado_muda' | 
                'gestionado_otro_agente' | 'contacto_terceros' | 'fallecio' | 'numero_equivocado' | 'no_dejo_datos' | 
                'corta_llamada' | 'volver_llamar' | 'reprogramar' |
                'telefono_no_existe' | 'numero_suspendido' | 'no_contesta' | 'apagado'
    assignedTo?: string | null
    leadType: LeadType
    source?: string | null
    createdAt?: any
    notes?: string
    contactedAt?: any
    updatedAt?: any
    
    // Transfer tracking
    transferredTo?: string | null  // Department: 'legal', etc.
    transferredAt?: any
    previousOwner?: string | null  // UID of previous owner
    
    // Legal review fields
    legalStatus?: 'pending_review' | 'approved' | 'rejected'
    legalComments?: string
    legalReviewedAt?: any
    legalReviewedBy?: string  // UID of legal user who reviewed
    
    // Commercial review fields
    commercialStatus?: 'pending_review' | 'approved' | 'rejected'
    commercialComments?: string
    commercialReviewedAt?: any
    commercialReviewedBy?: string  // UID of commercial user who reviewed
    
    // Location
    department?: string
    province?: string
    district?: string
    address?: string
    
    // Loan Details
    identityDocument?: string
    interestRate?: number
    meetsRequirements?: boolean
    
    // Investment Details
    maritalStatus?: string
    bank?: string
    bankAccount?: string
    interbankAccount?: string
    
    // Documents (Firebase Storage URLs)
    documents?: {
        dni?: string
        puhr?: string
        copiaLiteral?: string
        casa?: string
    }
    
    // Appointment (only for approved leads with status Contactado + Cita)
    appointment?: {
        date: string          // ISO date string (YYYY-MM-DD)
        time: string          // Time string (HH:MM)
        type: 'presencial' | 'virtual'
        appraisalCost?: number  // Costo de tasación
        scheduledAt?: any     // Timestamp when appointment was scheduled
        scheduledBy?: string  // UID of user who scheduled
    }
    
    // Closer assignment (lead stays with executive, but closer attends appointment)
    closerAssignedTo?: string  // UID of closer assigned to attend appointment
    closerAssignedAt?: any     // Timestamp when closer was assigned
    appointmentLocked?: boolean // True after appointment is saved for the first time
    
    // Closer follow-up (filled by closer after appointment)
    closerFollowUp?: {
        clientAttended: boolean  // Did client attend the appointment?
        attendanceRecordedAt?: any  // Timestamp when attendance was recorded
        attendanceRecordedBy?: string  // UID of closer who recorded
        
        // If client did NOT attend
        markedAsLost?: boolean  // True if marked as lost
        lostReason?: string     // Motivo por el cual se marcó como perdido
        
        // If client DID attend
        acceptsTerms?: boolean  // Accepts 10% + nominal and registry expenses
        clientIncome?: number   // Client's income in Soles (S/)
        loanReason?: string     // Reason for the loan
        agreedQuota?: number    // Acuerdo de Cuota (S/)
        paymentPlan?: string    // Modalidad y Plan de Pago
        paidAppraisal?: boolean // ¿Realizó pago de tasación?
        
        // If appraisal NOT paid
        paymentCommitmentDate?: string  // Fecha de compromiso de pago
        lostDueToNonPayment?: boolean   // Perdido por no pago
        
        // Reschedule
        rescheduledAt?: any
        rescheduledBy?: string
        
        // If appraisal PAID (later)
        paymentDate?: any // Timestamp of payment
    }

    // Appraisal details (filled by appraisal manager)
    appraisal?: {
        price?: number          // Precio de tasación
        garagePrice?: number    // Tasación cochera
        situation?: string      // Situación
        area?: number           // Área (m2)
        usage?: string          // Uso
        reportUrl?: string      // URL del reporte PDF
        investorName?: string      // Nombre del inversionista
        investorPhone?: string     // Teléfono del inversionista
        completedAt?: any       // Fecha de completado
        completedBy?: string    // UID del gestor
        history?: {             // Historial de cambios
            updatedAt: any
            updatedBy: string
            previousValues: {
                price?: number
                garagePrice?: number
                situation?: string
                area?: number
                usage?: string
                reportUrl?: string
                investorName?: string
                investorPhone?: string
            }
        }[]
    }
}

export interface LeadUploadRow {
    Nombre: string
    Telefono: string
    Email?: string
    Monto?: number
    [key: string]: any
}
