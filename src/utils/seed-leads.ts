import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { toast } from "sonner"
import { db } from "@/lib/firebase"

export async function seedLeads() {
    try {
        console.log("🌱 Starting lead seeding...")

        // Get executive user
        const usersRef = collection(db, "users")
        const executiveQuery = query(usersRef, where("role", "==", "executive"))
        const executiveSnapshot = await getDocs(executiveQuery)
        
        if (executiveSnapshot.empty) {
            console.error("❌ No executive user found. Please create an executive user first.")
            return
        }

        const executiveUser = executiveSnapshot.docs[0]
        const executiveId = executiveUser.id
        const executiveName = executiveUser.data().displayName

        console.log(`✅ Found executive: ${executiveName} (${executiveId})`)

        // Create 3 test leads
        const testLeads = [
            {
                name: "Juan Pérez García",
                phone: "987654321",
                email: "juan.perez@example.com",
                status: "nuevo",
                assignedTo: executiveId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                department: "Lima",
                province: "Lima",
                district: "Miraflores",
                address: "Av. Larco 1234",
                identityDocument: "12345678",
                amount: 50000,
                interestRate: 12.5,
                meetsRequirements: true,
                documents: {}
            },
            {
                name: "María González López",
                phone: "987654322",
                email: "maria.gonzalez@example.com",
                status: "nuevo",
                assignedTo: executiveId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                department: "Lima",
                province: "Lima",
                district: "San Isidro",
                address: "Av. Javier Prado 5678",
                identityDocument: "87654321",
                amount: 75000,
                interestRate: 11.8,
                meetsRequirements: true,
                documents: {}
            },
            {
                name: "Carlos Rodríguez Sánchez",
                phone: "987654323",
                email: "carlos.rodriguez@example.com",
                status: "nuevo",
                assignedTo: executiveId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                department: "Lima",
                province: "Lima",
                district: "Surco",
                address: "Av. Primavera 9012",
                identityDocument: "45678912",
                amount: 100000,
                interestRate: 10.5,
                meetsRequirements: true,
                documents: {}
            }
        ]

        const leadsRef = collection(db, "leads")
        
        for (const lead of testLeads) {
            const docRef = await addDoc(leadsRef, lead)
            console.log(`✅ Created lead: ${lead.name} (ID: ${docRef.id})`)
        }

        console.log("🎉 Successfully seeded 3 test leads!")
        console.log(`📋 All leads assigned to: ${executiveName}`)
        
        toast.success(`✅ Successfully created 3 test leads!\nAssigned to: ${executiveName}`)
        
    } catch (error) {
        console.error("❌ Error seeding leads:", error)
        toast.error("Error creating test leads. Check console for details.")
    }
}
