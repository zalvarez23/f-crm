import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

export const verifyLegalUsers = async () => {
    try {
        console.log('🔍 Checking for legal users in Firestore...')
        
        const usersSnapshot = await getDocs(
            query(collection(db, "users"), where("role", "==", "legal"))
        )
        
        if (usersSnapshot.empty) {
            console.error('❌ No legal users found in database!')
            console.log('Please create a legal user from the Users page or run the seed script')
            return false
        }
        
        console.log(`✅ Found ${usersSnapshot.size} legal user(s):`)
        usersSnapshot.docs.forEach(doc => {
            const user = doc.data()
            console.log(`  - ${user.displayName} (${user.email}) - UID: ${doc.id}`)
        })
        
        return true
    } catch (error) {
        console.error('Error checking legal users:', error)
        return false
    }
}

export const checkLeadTransfer = async (leadId: string) => {
    try {
        const { doc, getDoc } = await import("firebase/firestore")
        const leadDoc = await getDoc(doc(db, "leads", leadId))
        
        if (!leadDoc.exists()) {
            console.error('Lead not found')
            return
        }
        
        const lead = leadDoc.data()
        console.log('📋 Lead Transfer Info:')
        console.log(`  Status: ${lead.status}`)
        console.log(`  Substatus: ${lead.substatus}`)
        console.log(`  Assigned To: ${lead.assignedTo}`)
        console.log(`  Transferred To: ${lead.transferredTo || 'Not transferred'}`)
        console.log(`  Previous Owner: ${lead.previousOwner || 'N/A'}`)
        console.log(`  Transferred At: ${lead.transferredAt || 'N/A'}`)
    } catch (error) {
        console.error('Error checking lead:', error)
    }
}
