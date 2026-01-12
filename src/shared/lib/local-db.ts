import type { UserProfile, UserStatus } from "../types/user.types"

const USERS_STORAGE_KEY = 'f-crm-mock-users'

const INITIAL_USERS: UserProfile[] = [
    {
        uid: 'admin-id',
        email: 'admin@intercapital.com',
        password: 'password123',
        role: 'administrator',
        displayName: 'Administrador Sistema',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'supervisor-id',
        email: 'supervisor@intercapital.com',
        password: 'password123',
        role: 'supervisor',
        displayName: 'Supervisor General',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'exec-id',
        email: 'ejecutivo@intercapital.com',
        password: 'password123',
        role: 'loan_executive',
        displayName: 'Ejecutivo Préstamos',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'appraisal-id',
        email: 'tasacion@intercapital.com',
        password: 'password123',
        role: 'appraisal_manager',
        displayName: 'Gestor de Tasación',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'investment-id',
        email: 'inversion@intercapital.com',
        password: 'password123',
        role: 'investment_executive',
        displayName: 'Ejecutivo Inversiones',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'legal-id',
        email: 'legal@intercapital.com',
        password: 'password123',
        role: 'legal',
        displayName: 'Analista Legal',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'commercial-id',
        email: 'comercial@intercapital.com',
        password: 'password123',
        role: 'commercial',
        displayName: 'Gerente Comercial',
        status: 'available',
        createdAt: new Date()
    },
    {
        uid: 'closer-id',
        email: 'formalizador@intercapital.com',
        password: 'password123',
        role: 'closer',
        displayName: 'Formalizador',
        status: 'available',
        createdAt: new Date()
    }
]

export const localDb = {
    getUsers(): UserProfile[] {
        const stored = localStorage.getItem(USERS_STORAGE_KEY)
        if (!stored) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS))
            return INITIAL_USERS
        }
        try {
            const storedUsers = JSON.parse(stored).map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) }))
            // Ensure all INITIAL_USERS are present (by email) to handle updates to the mock user list
            const storedEmails = new Set(storedUsers.map((u: any) => u.email))
            const missingUsers = INITIAL_USERS.filter(u => !storedEmails.has(u.email))
            
            if (missingUsers.length > 0) {
                const updatedUsers = [...storedUsers, ...missingUsers]
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
                return updatedUsers
            }
            
            return storedUsers
        } catch (e) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS))
            return INITIAL_USERS
        }
    },

    saveUsers(users: UserProfile[]) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
        // Dispatch custom event for "real-time" simulation in the same browser
        window.dispatchEvent(new CustomEvent('local-db-update', { detail: users }))
    },

    setLocalMode(enabled: boolean) {
        localStorage.setItem('f-crm-local-mode', enabled ? 'true' : 'false')
    },

    isLocalMode(): boolean {
        return false // Always force Firebase mode
    },

    updateUserStatus(uid: string, status: UserStatus) {
        const users = this.getUsers()
        const index = users.findIndex(u => u.uid === uid)
        if (index !== -1) {
            users[index].status = status
            this.saveUsers(users)
        }
        return users[index]
    },

    login(email: string, password: string): UserProfile | null {
        const users = this.getUsers()
        return users.find(u => u.email === email && u.password === password) || null
    }
}
