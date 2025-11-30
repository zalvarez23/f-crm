import { collection, addDoc, getDocs, doc, updateDoc, query, where, serverTimestamp, writeBatch, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import type { Lead } from "../types/leads.types"

export const leadsService = {
    async uploadLeads(
        leads: Omit<Lead, 'id' | 'createdAt'>[], 
        distributionMethod: 'manual' | 'round-robin' = 'manual',
        executiveIds: string[] = []
    ): Promise<void> {
        const batch = writeBatch(db)

        leads.forEach((lead, index) => {
            const docRef = doc(collection(db, "leads"))

            let assignedTo = lead.assignedTo

            if (distributionMethod === 'round-robin' && executiveIds.length > 0) {
                // Round robin assignment
                assignedTo = executiveIds[index % executiveIds.length]
            }

            batch.set(docRef, {
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                amount: lead.amount,
                status: 'nuevo',
                assignedTo: assignedTo,
                source: 'excel-upload',
                createdAt: serverTimestamp()
            })
        })

        await batch.commit()
    },

    async createLead(leadData: Omit<Lead, 'id'>, distributionMethod: 'equitable' | 'random'): Promise<void> {
        const leadWithDefaults = {
            ...leadData,
            status: 'nuevo' as const,
            createdAt: serverTimestamp()
        }

        if (distributionMethod === 'random') {
            // Get all executives
            const executivesSnapshot = await getDocs(
                query(collection(db, "users"), where("role", "==", "executive"))
            )
            const executives = executivesSnapshot.docs.map(doc => doc.data())
            
            if (executives.length > 0) {
                // Random assignment
                const randomExecutive = executives[Math.floor(Math.random() * executives.length)]
                leadWithDefaults.assignedTo = randomExecutive.uid
            }
        }

        await addDoc(collection(db, "leads"), leadWithDefaults)
    },



    async getLeadsByExecutive(executiveId: string): Promise<Lead[]> {
        console.log(`🔍 Getting leads for executive: ${executiveId}`)
        
        // Get leads assigned to this executive
        const assignedQuery = query(
            collection(db, "leads"), 
            where("assignedTo", "==", executiveId)
        )
        const assignedSnapshot = await getDocs(assignedQuery)
        const assignedLeads = assignedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead))
        console.log(`📋 Found ${assignedLeads.length} leads assigned to executive`)
        
        // Get leads where this executive is the previous owner (transferred leads they can still see)
        const transferredQuery = query(
            collection(db, "leads"),
            where("previousOwner", "==", executiveId)
        )
        const transferredSnapshot = await getDocs(transferredQuery)
        const transferredLeads = transferredSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead))
        console.log(`📤 Found ${transferredLeads.length} leads where executive is previousOwner`)
        
        // Combine and deduplicate (in case a lead appears in both)
        const allLeads = [...assignedLeads, ...transferredLeads]
        const uniqueLeads = Array.from(new Map(allLeads.map(lead => [lead.id, lead])).values())
        
        // Sort by createdAt in JavaScript (descending - newest first)
        uniqueLeads.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0
            const bTime = b.createdAt?.seconds || 0
            return bTime - aTime
        })
        
        console.log(`✅ Total unique leads for executive: ${uniqueLeads.length}`)
        
        return uniqueLeads
    },

    async getUnassignedLeads(): Promise<Lead[]> {
        const q = query(
            collection(db, "leads"),
            where("assignedTo", "==", null)
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Lead))
    },

    async getAllLeads(): Promise<Lead[]> {
        const snapshot = await getDocs(collection(db, "leads"))
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Lead))
    },

    async getLeadsStats(): Promise<{
        totalLeads: number
        pendingLeads: number
        contactedLeads: number
    }> {
        const allLeads = await this.getAllLeads()
        const pendingLeads = allLeads.filter(lead => lead.status === 'nuevo')
        const contactedLeads = allLeads.filter(lead => lead.status !== 'nuevo')

        return {
            totalLeads: allLeads.length,
            pendingLeads: pendingLeads.length,
            contactedLeads: contactedLeads.length
        }
    },

    async getLeadsByExecutiveCount(): Promise<{ executiveId: string; count: number }[]> {
        const allLeads = await this.getAllLeads()
        const countMap = new Map<string, number>()

        allLeads.forEach(lead => {
            if (lead.assignedTo) {
                countMap.set(lead.assignedTo, (countMap.get(lead.assignedTo) || 0) + 1)
            }
        })

        return Array.from(countMap.entries()).map(([executiveId, count]) => ({
            executiveId,
            count
        }))
    },

    async updateLead(leadId: string, data: Partial<Lead>): Promise<void> {
        const docRef = doc(db, "leads", leadId)
        
        const updateData: any = {
            ...data,
            updatedAt: serverTimestamp()
        }

        // Get current lead data
        const leadDoc = await getDoc(docRef)
        if (!leadDoc.exists()) {
            throw new Error('Lead not found')
        }
        const currentLead = leadDoc.data() as Lead

        // If status is changing from 'nuevo' to something else, set contactedAt
        if (data.status && data.status !== 'nuevo') {
            if (currentLead.status === 'nuevo' && !currentLead.contactedAt) {
                updateData.contactedAt = serverTimestamp()
            }
        }

        // Check for automatic transfer to Legal
        // When status = 'contactado' AND substatus = 'en_validacion'
        if (data.status === 'contactado' && data.substatus === 'en_validacion') {
            console.log('🔄 Transfer condition met: Contactado + En Validación')
            
            // Find legal users
            const usersSnapshot = await getDocs(
                query(collection(db, "users"), where("role", "==", "legal"))
            )
            
            console.log(`📊 Found ${usersSnapshot.size} legal user(s) in database`)
            
            if (!usersSnapshot.empty) {
                // Random assignment to a legal user
                // Use doc.id as the uid since that's the Firestore document ID
                const legalUsers = usersSnapshot.docs.map(doc => {
                    const userData = doc.data() as any
                    return {
                        uid: doc.id,  // This is the actual Firestore document ID
                        displayName: userData.displayName,
                        email: userData.email,
                        role: userData.role
                    }
                })
                
                console.log('👥 Legal users:', legalUsers.map(u => `${u.displayName} (${u.email}) [${u.uid}]`))
                
                const randomLegal = legalUsers[Math.floor(Math.random() * legalUsers.length)]
                
                // Set transfer data
                updateData.transferredTo = 'legal'
                updateData.transferredAt = serverTimestamp()
                updateData.previousOwner = currentLead.assignedTo
                updateData.assignedTo = randomLegal.uid  // Now this will have the correct document ID
                updateData.legalStatus = 'pending_review'  // Set as pending review for Legal
                
                console.log(`✅ Lead ${leadId} transferred to legal user ${randomLegal.displayName} (UID: ${randomLegal.uid})`)
                console.log(`📝 Previous owner (executive): ${currentLead.assignedTo}`)
                console.log(`📝 New owner (legal): ${randomLegal.uid}`)
                console.log(`⚖️ Legal status set to: pending_review`)
                console.log(`💾 previousOwner field will be set to: ${currentLead.assignedTo}`)
            } else {
                console.warn('❌ No legal users found for transfer - lead will not be transferred')
                console.log('💡 Please create a legal user from the Users page or run the seed script')
            }
        } else {
            console.log(`ℹ️ Transfer not triggered. Status: ${data.status}, Substatus: ${data.substatus}`)
        }

        // Remove undefined values (Firestore doesn't accept undefined)
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key]
            }
        })

        await updateDoc(docRef, updateData)
    },

    async uploadDocument(leadId: string, file: File, documentType: 'dni' | 'puhr' | 'copiaLiteral' | 'casa'): Promise<string> {
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
        const { storage } = await import('@/lib/firebase')
        
        // Create a reference to the file location
        const fileRef = ref(storage, `leads/${leadId}/${documentType}_${Date.now()}.pdf`)
        
        // Upload the file
        await uploadBytes(fileRef, file)
        
        // Get the download URL
        const downloadURL = await getDownloadURL(fileRef)
        
        return downloadURL
    },

    async approveLead(leadId: string, legalComments: string, legalUserId: string): Promise<void> {
        const docRef = doc(db, "leads", leadId)
        
        // Get current lead data
        const leadDoc = await getDoc(docRef)
        if (!leadDoc.exists()) {
            throw new Error('Lead not found')
        }
        const currentLead = leadDoc.data() as Lead
        
        const updateData: any = {
            legalStatus: 'approved',
            legalComments,
            legalReviewedAt: serverTimestamp(),
            legalReviewedBy: legalUserId,
            updatedAt: serverTimestamp()
        }
        
        // Find commercial users to transfer the lead
        const usersSnapshot = await getDocs(
            query(collection(db, "users"), where("role", "==", "commercial"))
        )
        
        console.log(`📊 Found ${usersSnapshot.size} commercial user(s) for transfer`)
        
        if (!usersSnapshot.empty) {
            // Random assignment to a commercial user
            const commercialUsers = usersSnapshot.docs.map(doc => {
                const userData = doc.data() as any
                return {
                    uid: doc.id,
                    displayName: userData.displayName,
                    email: userData.email,
                    role: userData.role
                }
            })
            
            console.log('👥 Commercial users:', commercialUsers.map(u => `${u.displayName} (${u.email}) [${u.uid}]`))
            
            const randomCommercial = commercialUsers[Math.floor(Math.random() * commercialUsers.length)]
            
            // Transfer to Commercial
            updateData.transferredTo = 'commercial'
            updateData.transferredAt = serverTimestamp()
            // IMPORTANT: Only set previousOwner if it doesn't exist
            // This preserves the original executive owner through multiple transfers
            if (!currentLead.previousOwner) {
                updateData.previousOwner = currentLead.assignedTo
            }
            updateData.assignedTo = randomCommercial.uid
            updateData.commercialStatus = 'pending_review'
            
            console.log(`✅ Lead ${leadId} approved by legal and transferred to commercial user ${randomCommercial.displayName} (UID: ${randomCommercial.uid})`)
            console.log(`📝 Original owner (executive) preserved: ${currentLead.previousOwner || currentLead.assignedTo}`)
        } else {
            console.warn('❌ No commercial users found - lead approved but not transferred')
        }
        
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key]
            }
        })
        
        await updateDoc(docRef, updateData)
    },

    async rejectLead(leadId: string, legalComments: string, legalUserId: string): Promise<void> {
        const docRef = doc(db, "leads", leadId)
        
        // Get current lead data
        const leadDoc = await getDoc(docRef)
        if (!leadDoc.exists()) {
            throw new Error('Lead not found')
        }
        const currentLead = leadDoc.data() as Lead
        
        const updateData: any = {
            legalStatus: 'rejected',
            legalComments,
            legalReviewedAt: serverTimestamp(),
            legalReviewedBy: legalUserId,
            status: 'rechazado',  // Set main status to rechazado
            assignedTo: currentLead.previousOwner,  // Return to original executive
            transferredTo: null,  // Clear transfer
            updatedAt: serverTimestamp()
        }
        
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key]
            }
        })
        
        await updateDoc(docRef, updateData)
        
        console.log(`❌ Lead ${leadId} rejected by legal user ${legalUserId}`)
        console.log(`↩️ Lead returned to executive ${currentLead.previousOwner} with status 'rechazado'`)
    },

    async approveCommercialLead(leadId: string, commercialComments: string, commercialUserId: string): Promise<void> {
        const docRef = doc(db, "leads", leadId)
        
        const updateData: any = {
            commercialStatus: 'approved',
            commercialComments,
            commercialReviewedAt: serverTimestamp(),
            commercialReviewedBy: commercialUserId,
            updatedAt: serverTimestamp()
        }
        
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key]
            }
        })
        
        await updateDoc(docRef, updateData)
        
        console.log(`✅ Lead ${leadId} approved by commercial user ${commercialUserId}`)
    },

    async rejectCommercialLead(leadId: string, commercialComments: string, commercialUserId: string): Promise<void> {
        const docRef = doc(db, "leads", leadId)
        
        // Get current lead data
        const leadDoc = await getDoc(docRef)
        if (!leadDoc.exists()) {
            throw new Error('Lead not found')
        }
        const currentLead = leadDoc.data() as Lead
        
        const updateData: any = {
            commercialStatus: 'rejected',
            commercialComments,
            commercialReviewedAt: serverTimestamp(),
            commercialReviewedBy: commercialUserId,
            status: 'rechazado',  // Set main status to rechazado
            assignedTo: currentLead.previousOwner,  // Return to original executive
            transferredTo: null,  // Clear transfer
            updatedAt: serverTimestamp()
        }
        
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key]
            }
        })
        
        await updateDoc(docRef, updateData)
        
        console.log(`❌ Lead ${leadId} rejected by commercial user ${commercialUserId}`)
        console.log(`↩️ Lead returned to executive ${currentLead.previousOwner} with status 'rechazado'`)
    }
}
