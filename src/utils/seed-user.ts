import { db } from "@/lib/firebase"
import { serverTimestamp, collection, addDoc, query, where, getDocs } from "firebase/firestore"

const createUser = async (email: string, password: string, role: any, displayName: string) => {
    // Priority: Always use Firestore now
    // if (localDb.isLocalMode()) { ... } removed

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
        // Removed fallback to local mode
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
