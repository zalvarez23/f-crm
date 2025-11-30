import { db } from "@/lib/firebase"
import { serverTimestamp, collection, addDoc } from "firebase/firestore"

const createUser = async (email: string, password: string, role: string, displayName: string) => {
    try {
        console.log(`Creating ${role} user: ${email}...`)
        
        // For custom auth, we just create a document in 'users' collection
        // We can use email as ID or auto-generate. Using auto-generate is safer for duplicates check later,
        // but using email as ID makes it easy to find. Let's use auto-generated ID for consistency with typical Firestore usage,
        // but we need to query by email for login.
        
        // Actually, to make it easy to update if exists, let's query first or use a deterministic ID if we wanted.
        // But for this seed, let's just addDoc.
        
        await addDoc(collection(db, "users"), {
            email,
            password, // Storing plain text as requested for internal tool
            role,
            displayName,
            createdAt: serverTimestamp()
        })
        
        console.log(`User ${email} created successfully!`)

    } catch (error) {
        console.error(`Error creating ${email}:`, error)
    }
}

export const seedSupervisor = async () => {
    // Note: This script might create duplicates if run multiple times because we are using addDoc
    // In a real seed we might want to check existence first.
    await createUser("supervisor@intercapital.com", "password123", "supervisor", "Supervisor General")
    await createUser("ejecutivo@intercapital.com", "password123", "executive", "Ejecutivo Ventas")
    await createUser("admin@intercapital.com", "password123", "administrator", "Administrador Sistema")
    await createUser("legal@intercapital.com", "password123", "legal", "Legal Department")
    await createUser("comercial@intercapital.com", "password123", "commercial", "Commercial Department")
    alert("Usuarios creados (Incluyendo Admin, Legal y Comercial). Revisa la consola.")
}
