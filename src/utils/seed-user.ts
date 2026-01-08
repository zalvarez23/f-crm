import { db } from "@/lib/firebase"
import { serverTimestamp, collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { localDb } from "@/shared/lib/local-db"
import type { UserProfile } from "@/shared/types/user.types"

const createUser = async (email: string, password: string, role: any, displayName: string) => {
    // Priority 1: Try Local Mode if forced
    if (localDb.isLocalMode()) {
        const users = localDb.getUsers()
        if (users.some(u => u.email === email)) {
            console.log(`⚠️ (Local) User ${email} already exists, skipping...`)
            return
        }
        const newUser: UserProfile = {
            uid: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email,
            password,
            role,
            displayName,
            status: 'available',
            createdAt: new Date()
        }
        users.push(newUser)
        localDb.saveUsers(users)
        console.log(`✅ (Local) User ${email} created locally!`)
        return
    }

    try {
        // Priority 2: Try Firestore
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", email))
        const existingUsers = await getDocs(q)
        
        if (!existingUsers.empty) {
            console.log(`⚠️ User ${email} already exists in Firestore, skipping...`)
            return
        }
        
        console.log(`Creating ${role} user in Firestore: ${email}...`)
        
        await addDoc(collection(db, "users"), {
            email,
            password,
            role,
            displayName,
            createdAt: serverTimestamp()
        })
        
        console.log(`✅ User ${email} created in Firestore!`)

    } catch (error: any) {
        console.error(`❌ Error creating ${email} in Firestore:`, error)
        if (error.code === 'permission-denied') {
            console.warn("Permission denied, falling back to local creation")
            localDb.setLocalMode(true)
            // Recursive call will now go to Local Mode branch
            await createUser(email, password, role, displayName)
        }
    }
}

export const seedSupervisor = async () => {
    console.log("🌱 Starting user seeding...")
    await createUser("supervisor@intercapital.com", "password123", "supervisor", "Supervisor General")
    await createUser("ejecutivo@intercapital.com", "password123", "loan_executive", "Ejecutivo de Préstamos")
    await createUser("admin@intercapital.com", "password123", "administrator", "Administrador Sistema")
    await createUser("legal@intercapital.com", "password123", "legal", "Legal Department")
    await createUser("comercial@intercapital.com", "password123", "commercial", "Commercial Department")
    await createUser("closer@intercapital.com", "password123", "closer", "Closer Department")
    await createUser("tasacion@intercapital.com", "password123", "appraisal_manager", "Gestor de Tasación")
    await createUser("inversion@intercapital.com", "password123", "investment_executive", "Ejecutivo de Inversiones")
    console.log("✅ User seeding completed!")
    alert("✅ Usuarios verificados/creados (Admin, Legal, Comercial, Closer, Tasación). Revisa la consola.")
}
