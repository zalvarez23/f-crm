export type LeadStatus = 'new' | 'contacted' | 'interested' | 'closed' | 'lost'

export interface Lead {
    id?: string
    name: string
    phone: string
    email?: string
    amount: number
    status: 'nuevo' | 'contactado' | 'contacto_no_efectivo' | 'no_contactado' | 'rechazado'
    substatus?: 'interesado' | 'gestion_whatsapp' | 'inversionista' | 'agendado_potencial' | 'cita' | 'seguimiento' | 'en_validacion' | 
                'no_califica' | 'prestamo_menos_15000' | 'consiguio_prestamo' | 'no_interesado' | 'llamado_muda' | 
                'gestionado_otro_agente' | 'contacto_terceros' | 'fallecio' | 'numero_equivocado' | 'no_dejo_datos' | 
                'corta_llamada' | 'volver_llamar' |
                'telefono_no_existe' | 'numero_suspendido' | 'no_contesta' | 'apagado'
    assignedTo?: string
    source: string
    createdAt?: any
    notes?: string
    contactedAt?: any
    updatedAt?: any
    
    // Transfer tracking
    transferredTo?: string  // Department: 'legal', etc.
    transferredAt?: any
    previousOwner?: string  // UID of previous owner
    
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
    
    // Documents (Firebase Storage URLs)
    documents?: {
        dni?: string
        puhr?: string
        copiaLiteral?: string
        casa?: string
    }
}

export interface LeadUploadRow {
    Nombre: string
    Telefono: string
    Email?: string
    Monto?: number
    [key: string]: any
}
