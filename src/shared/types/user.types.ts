export type UserRole = 'loan_executive' | 'supervisor' | 'administrator' | 'legal' | 'commercial' | 'closer' | 'appraisal_manager' | 'investment_executive'

export type UserStatus = 'available' | 'bathroom' | 'lunch' | 'break' | 'end_shift' | 'meeting'

export interface UserProfile {
    uid: string
    email: string
    role: UserRole
    status?: UserStatus
    displayName?: string
    photoURL?: string
    password?: string // Stored for custom auth (internal use only)
    statusUpdatedAt?: any // Firestore Timestamp or Date
    createdAt: Date
}
