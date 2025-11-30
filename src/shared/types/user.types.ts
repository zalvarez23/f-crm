export type UserRole = 'admin' | 'supervisor' | 'executive' | 'administrator' | 'legal' | 'commercial'

export interface UserProfile {
    uid: string
    email: string
    role: UserRole
    displayName?: string
    photoURL?: string
    password?: string // Stored for custom auth (internal use only)
    createdAt: Date
}
