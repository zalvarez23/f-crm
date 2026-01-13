import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Lead } from "../types/leads.types";

export const leadsService = {
  async uploadLeads(
    leads: Omit<Lead, "id" | "createdAt">[],
    distributionMethod: "manual" | "round-robin" = "manual",
    executiveIds: string[] = [],
    leadType: "loan" | "investment" = "loan"
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      leads.forEach((lead, index) => {
        const docRef = doc(collection(db, "leads"));

        let assignedTo = lead.assignedTo;

        if (distributionMethod === "round-robin" && executiveIds.length > 0) {
          assignedTo = executiveIds[index % executiveIds.length];
        }

        const data: any = {
          name: lead.name,
          phone: lead.phone,
          email: lead.email || null,
          amount: lead.amount,
          status: "nuevo" as const,
          assignedTo: assignedTo || null,
          leadType: leadType,
          source: "excel-upload",
          createdAt: serverTimestamp(),
        };

        // Clean undefined
        const cleanData: any = {};
        Object.keys(data).forEach((key) => {
          if (data[key] !== undefined) cleanData[key] = data[key];
        });

        batch.set(docRef, cleanData);
      });

      await batch.commit();
    } catch (error: any) {
      console.warn("leadsService: Failed to upload leads to Firestore", error);
      throw error;
    }
  },

  async createLead(
    leadData: Omit<Lead, "id">,
    distributionMethod: "equitable" | "random"
  ): Promise<void> {
    try {
      const data: any = {
        ...leadData,
        status: "nuevo" as const,
        createdAt: serverTimestamp(),
      };

      if (distributionMethod === "random") {
        const role =
          leadData.leadType === "investment"
            ? "investment_executive"
            : "loan_executive";
        const executivesSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", role))
        );
        const executives = executivesSnapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as any)
        );

        if (executives.length > 0) {
          const randomExecutive =
            executives[Math.floor(Math.random() * executives.length)];
          data.assignedTo = randomExecutive.uid;
        }
      }

      // Safe cleaning of undefined values for Firestore
      const cleanData: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          cleanData[key] = data[key];
        }
      });

      await addDoc(collection(db, "leads"), cleanData);
    } catch (error: any) {
      console.warn("leadsService: Failed to create lead in Firestore", error);
      // Switch to local mode for permissions, invalid data (if it means we should go local), or connection issues
      throw error;
    }
  },

  async getLeadsByExecutive(executiveId: string): Promise<Lead[]> {
    console.log(`🔍 Getting leads for executive: ${executiveId}`);

    // Get leads assigned to this executive
    const assignedQuery = query(
      collection(db, "leads"),
      where("assignedTo", "==", executiveId)
    );
    const assignedSnapshot = await getDocs(assignedQuery);
    const assignedLeads = assignedSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Lead)
    );
    console.log(`📋 Found ${assignedLeads.length} leads assigned to executive`);

    // Get leads where this executive is the previous owner (transferred leads they can still see)
    const transferredQuery = query(
      collection(db, "leads"),
      where("previousOwner", "==", executiveId)
    );
    const transferredSnapshot = await getDocs(transferredQuery);
    const transferredLeads = transferredSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Lead)
    );
    console.log(
      `📤 Found ${transferredLeads.length} leads where executive is previousOwner`
    );

    // Combine and deduplicate (in case a lead appears in both)
    const allLeads = [...assignedLeads, ...transferredLeads];
    const uniqueLeads = Array.from(
      new Map(allLeads.map((lead) => [lead.id, lead])).values()
    );

    // Sort by createdAt in JavaScript (descending - newest first)
    uniqueLeads.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    console.log(`✅ Total unique leads for executive: ${uniqueLeads.length}`);

    return uniqueLeads;
  },

  async getLeadsByCloser(closerId: string): Promise<Lead[]> {
    console.log(`🔍 Getting leads for closer: ${closerId}`);

    // Get leads where this closer is assigned to attend the appointment
    const closerQuery = query(
      collection(db, "leads"),
      where("closerAssignedTo", "==", closerId)
    );
    const closerSnapshot = await getDocs(closerQuery);
    const closerLeads = closerSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Lead)
    );

    console.log(`📋 Found ${closerLeads.length} leads assigned to closer`);

    // Sort by appointment date (ascending - nearest first)
    closerLeads.sort((a, b) => {
      if (!a.appointment?.date || !b.appointment?.date) return 0;
      return (
        new Date(a.appointment.date).getTime() -
        new Date(b.appointment.date).getTime()
      );
    });

    return closerLeads;
  },

  async getLeadsReviewedByUser(
    userId: string,
    role: "legal" | "commercial"
  ): Promise<Lead[]> {
    const field = role === "legal" ? "legalReviewedBy" : "commercialReviewedBy";

    console.log(`🔍 Getting leads reviewed by ${role}: ${userId}`);

    const q = query(collection(db, "leads"), where(field, "==", userId));

    const snapshot = await getDocs(q);
    const leads = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Lead)
    );

    console.log(`📋 Found ${leads.length} leads reviewed by user`);
    return leads;
  },

  async getLeadsForAppraisalManager(): Promise<Lead[]> {
    console.log(`🔍 Getting leads for appraisal manager`);

    // Get leads where appraisal is paid
    const q = query(
      collection(db, "leads"),
      where("closerFollowUp.paidAppraisal", "==", true)
    );
    const snapshot = await getDocs(q);
    const leads = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Lead)
    );

    console.log(`📋 Found ${leads.length} leads with paid appraisal`);

    // Sort by payment date (descending - newest first)
    leads.sort((a, b) => {
      const aTime = (a.closerFollowUp?.paymentDate as any)?.seconds || 0;
      const bTime = (b.closerFollowUp?.paymentDate as any)?.seconds || 0;
      return bTime - aTime;
    });

    return leads;
  },

  async getLeadsByLegal(): Promise<Lead[]> {
    const q = query(collection(db, "leads"), where("assignedTo", "==", null));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Lead)
    );
  },

  async getUnassignedLeads(): Promise<Lead[]> {
    const q = query(collection(db, "leads"), where("assignedTo", "==", null));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Lead)
    );
  },

  async getAllLeads(): Promise<Lead[]> {
    try {
      const snapshot = await getDocs(collection(db, "leads"));
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Lead)
      );
    } catch (error: any) {
      console.warn(
        "leadsService: Failed to get all leads from Firestore",
        error
      );
      throw error;
    }
  },

  async getLeadsStats(): Promise<{
    totalLeads: number;
    pendingLeads: number;
    contactedLeads: number;
  }> {
    try {
      const allLeads = await this.getAllLeads();
      const pendingLeads = allLeads.filter((lead) => lead.status === "nuevo");
      const contactedLeads = allLeads.filter((lead) => lead.status !== "nuevo");

      return {
        totalLeads: allLeads.length,
        pendingLeads: pendingLeads.length,
        contactedLeads: contactedLeads.length,
      };
    } catch (error: any) {
      return { totalLeads: 0, pendingLeads: 0, contactedLeads: 0 };
    }
  },

  async getLeadsByExecutiveCount(): Promise<
    { executiveId: string; count: number }[]
  > {
    try {
      const allLeads = await this.getAllLeads();
      const countMap = new Map<string, number>();

      allLeads.forEach((lead) => {
        if (lead.assignedTo) {
          countMap.set(
            lead.assignedTo,
            (countMap.get(lead.assignedTo) || 0) + 1
          );
        }
      });

      return Array.from(countMap.entries()).map(([executiveId, count]) => ({
        executiveId,
        count,
      }));
    } catch (error: any) {
      return [];
    }
  },

  async updateLead(leadId: string, data: Partial<Lead>): Promise<void> {
    try {
      const docRef = doc(db, "leads", leadId);

      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Get current lead data
      const leadDoc = await getDoc(docRef);
      if (!leadDoc.exists()) {
        throw new Error("Lead not found");
      }
      const currentLead = leadDoc.data() as Lead;

      // If status is changing from 'nuevo' to something else, set contactedAt
      if (data.status && data.status !== "nuevo") {
        if (currentLead.status === "nuevo" && !currentLead.contactedAt) {
          updateData.contactedAt = serverTimestamp();
        }
      }

      // Check for automatic transfer to Legal
      if (data.status === "contactado" && data.substatus === "en_validacion") {
        console.log("🔄 Triggering transfer to Legal (Online Mode)...");
        const usersSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "legal"))
        );

        if (!usersSnapshot.empty) {
          const legalUsers = usersSnapshot.docs.map((doc) => ({
            uid: doc.id,
            displayName: (doc.data() as any).displayName,
            email: (doc.data() as any).email,
            role: (doc.data() as any).role,
          }));

          const randomLegal =
            legalUsers[Math.floor(Math.random() * legalUsers.length)];

          updateData.transferredTo = "legal";
          updateData.transferredAt = serverTimestamp();
          updateData.previousOwner = currentLead.assignedTo;
          updateData.assignedTo = randomLegal.uid;
          updateData.legalStatus = "pending_review";
          console.log(
            `✅ Transferred to legal user: ${randomLegal.displayName} (${randomLegal.uid})`
          );
        } else {
          console.warn(
            "⚠️ No legal users found in Firestore. Transfer skipped."
          );
        }
      }

      // Check for automatic assignment to Closer (Broadened trigger)
      const hasFullAppt =
        (data.appointment?.date &&
          data.appointment?.time &&
          data.appointment?.type) ||
        (currentLead.appointment?.date &&
          currentLead.appointment?.time &&
          currentLead.appointment?.type);
      const isApproved =
        currentLead.legalStatus === "approved" &&
        currentLead.commercialStatus === "approved";
      const needsAssign =
        !currentLead.closerAssignedTo ||
        currentLead.substatus === "reprogramar" ||
        data.substatus === "cita";

      console.log("🧐 Checking Closer assignment triggers...", {
        hasFullAppt,
        isApproved,
        needsAssign,
        currentSubstatus: currentLead.substatus,
        newSubstatus: data.substatus,
      });

      if (hasFullAppt && isApproved && needsAssign) {
        const usersSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", "closer"))
        );

        console.log(
          `🔍 Found ${usersSnapshot.size} potential closers in database`
        );

        if (!usersSnapshot.empty) {
          updateData.appointmentLocked = true;
          const closerUsers = usersSnapshot.docs.map((doc) => ({
            uid: doc.id,
            displayName: (doc.data() as any).displayName,
            email: (doc.data() as any).email,
            role: (doc.data() as any).role,
          }));

          // Prefer existing closer if already assigned
          const existingCloser = closerUsers.find(
            (u) => u.uid === currentLead.closerAssignedTo
          );
          const selectedCloser =
            existingCloser ||
            closerUsers[Math.floor(Math.random() * closerUsers.length)];

          console.log(
            `🎯 Selected closer: ${selectedCloser.displayName} (${selectedCloser.uid})`
          );

          updateData.closerAssignedTo = selectedCloser.uid;
          updateData.closerAssignedAt = serverTimestamp();
          updateData.previousOwner = currentLead.assignedTo;
          updateData.assignedTo = selectedCloser.uid;

          // Fix: Use merged appointment data
          updateData.appointment = {
            ...(currentLead.appointment || {}),
            ...(data.appointment || {}),
            scheduledAt: serverTimestamp(),
            scheduledBy: currentLead.assignedTo,
          };

          // Reschedule/Initial Assignment logic: Clear previous follow-ups
          updateData.substatus = "cita";
          updateData.closerFollowUp = {
            ...(currentLead.closerFollowUp || {}),
            clientAttended: null,
            markedAsLost: false,
            lostReason: null,
            lostDueToNonPayment: false,
            attendanceRecordedAt: null,
            attendanceRecordedBy: null,
          };
          console.log(`✅ Assignment complete for: ${currentLead.name}`);
        } else {
          console.warn(
            "⚠️ No closer users found in Firestore. Assignment skipped."
          );
        }
      }

      // Prune undefined but keep null for intentional clears
      // Also flatten closerFollowUp and appointment for partial updates in Firestore
      const cleanData: any = {};
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          if (
            key === "closerFollowUp" ||
            key === "appointment" ||
            key === "appraisal" ||
            key === "documents"
          ) {
            // Flatten these specific nested objects
            const nested = updateData[key];
            if (
              nested &&
              typeof nested === "object" &&
              !Array.isArray(nested)
            ) {
              Object.keys(nested).forEach((nestedKey) => {
                if (nested[nestedKey] !== undefined) {
                  cleanData[`${key}.${nestedKey}`] = nested[nestedKey];
                }
              });
            } else {
              cleanData[key] = updateData[key];
            }
          } else {
            cleanData[key] = updateData[key];
          }
        }
      });

      await updateDoc(docRef, cleanData);
    } catch (error: any) {
      console.warn("leadsService: Failed to update lead in Firestore", error);
      throw error;
    }
  },

  async uploadDocument(
    leadId: string,
    file: File,
    documentType: "dni" | "puhr" | "copiaLiteral" | "casa" | "tasacion"
  ): Promise<{ filename: string; fileUrl: string }> {
    try {
      // Generate UUID for unique filename
      const uuid = crypto.randomUUID();
      const filename = `${documentType}-${uuid}.pdf`;

      // Create a reference to the file location in Firebase Storage
      const fileRef = ref(storage, `leads/${leadId}/${filename}`);

      // Upload the file
      await uploadBytes(fileRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);

      return {
        filename,
        fileUrl: downloadURL,
      };
    } catch (error) {
      console.error("⚠️ Upload failed:", error);
      throw new Error(
        `Error uploading ${documentType} document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  async deleteDocument(leadId: string, filename: string): Promise<void> {
    try {
      const fileRef = ref(storage, `leads/${leadId}/${filename}`);
      await deleteObject(fileRef);
      console.log(`✅ Archivo eliminado: ${filename}`);
    } catch (error) {
      console.error("⚠️ Delete failed:", error);
      // No lanzar error si el archivo no existe (puede haber sido eliminado previamente)
      if (error instanceof Error && !error.message.includes("not found")) {
        throw new Error(
          `Error eliminando archivo ${filename}: ${error.message}`
        );
      }
    }
  },

  async approveLead(
    leadId: string,
    legalComments: string,
    legalUserId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, "leads", leadId);
      const leadDoc = await getDoc(docRef);
      if (!leadDoc.exists()) throw new Error("Lead not found");
      const currentLead = leadDoc.data() as Lead;

      const updateData: any = {
        legalStatus: "approved",
        legalComments,
        legalReviewedAt: serverTimestamp(),
        legalReviewedBy: legalUserId,
        updatedAt: serverTimestamp(),
      };

      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "commercial"))
      );

      if (!usersSnapshot.empty) {
        const commercialUsers = usersSnapshot.docs.map((doc) => ({
          uid: doc.id,
          displayName: (doc.data() as any).displayName,
          email: (doc.data() as any).email,
          role: (doc.data() as any).role,
        }));

        const randomCommercial =
          commercialUsers[Math.floor(Math.random() * commercialUsers.length)];
        updateData.transferredTo = "commercial";
        updateData.transferredAt = serverTimestamp();
        if (!currentLead.previousOwner) {
          updateData.previousOwner = currentLead.assignedTo;
        }
        updateData.assignedTo = randomCommercial.uid;
        updateData.commercialStatus = "pending_review";
        console.log(
          `✅ Transferred to commercial user: ${randomCommercial.displayName} (${randomCommercial.uid})`
        );
      } else {
        console.warn(
          "⚠️ No commercial users found in Firestore. Transfer skipped."
        );
      }

      const cleanData: any = {};
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) cleanData[key] = updateData[key];
      });
      await updateDoc(docRef, cleanData);
    } catch (error: any) {
      throw error;
    }
  },

  async rejectLead(
    leadId: string,
    legalComments: string,
    legalUserId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, "leads", leadId);
      const leadDoc = await getDoc(docRef);
      if (!leadDoc.exists()) throw new Error("Lead not found");
      const currentLead = leadDoc.data() as Lead;

      const updateData: any = {
        legalStatus: "rejected",
        legalComments,
        legalReviewedAt: serverTimestamp(),
        legalReviewedBy: legalUserId,
        status: "rechazado",
        assignedTo: currentLead.previousOwner,
        transferredTo: null,
        updatedAt: serverTimestamp(),
      };

      const cleanData: any = {};
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) cleanData[key] = updateData[key];
      });
      await updateDoc(docRef, cleanData);
    } catch (error: any) {
      throw error;
    }
  },

  async approveCommercialLead(
    leadId: string,
    commercialComments: string,
    commercialUserId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, "leads", leadId);
      const currentLeadSnapshot = await getDoc(docRef);
      const currentLead = currentLeadSnapshot.data() as Lead;

      const updateData: any = {
        commercialStatus: "approved",
        commercialComments,
        commercialReviewedAt: serverTimestamp(),
        commercialReviewedBy: commercialUserId,
        status: "contactado",
        substatus: "aprobado",
        assignedTo:
          currentLead?.previousOwner || currentLead?.assignedTo || null,
        updatedAt: serverTimestamp(),
      };
      const cleanData: any = {};
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) cleanData[key] = updateData[key];
      });
      await updateDoc(docRef, cleanData);
    } catch (error: any) {
      throw error;
    }
  },

  async rejectCommercialLead(
    leadId: string,
    commercialComments: string,
    commercialUserId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, "leads", leadId);
      const leadDoc = await getDoc(docRef);
      if (!leadDoc.exists()) throw new Error("Lead not found");
      const currentLead = leadDoc.data() as Lead;

      const updateData: any = {
        commercialStatus: "rejected",
        commercialComments,
        commercialReviewedAt: serverTimestamp(),
        commercialReviewedBy: commercialUserId,
        status: "rechazado",
        assignedTo: currentLead.previousOwner,
        transferredTo: null,
        updatedAt: serverTimestamp(),
      };
      const cleanData: any = {};
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) cleanData[key] = updateData[key];
      });
      await updateDoc(docRef, cleanData);
    } catch (error: any) {
      throw error;
    }
  },
  async getGlobalStats(): Promise<{
    totalLeads: number;
    byStatus: Record<string, number>;
    bySubstatus: Record<string, number>;
    byType: { loan: number; investment: number };
    legalStats: { pending: number; approved: number; rejected: number };
    commercialStats: { pending: number; approved: number; rejected: number };
    byExecutive: Record<string, number>;
  }> {
    try {
      const allLeads = await this.getAllLeads();

      const stats = {
        totalLeads: allLeads.length,
        byStatus: {} as Record<string, number>,
        bySubstatus: {} as Record<string, number>,
        byType: { loan: 0, investment: 0 },
        legalStats: { pending: 0, approved: 0, rejected: 0 },
        commercialStats: { pending: 0, approved: 0, rejected: 0 },
        byExecutive: {} as Record<string, number>,
      };

      allLeads.forEach((lead) => {
        // By Status
        const status = lead.status || "unknown";
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // By Substatus (only for relevant statuses)
        if (lead.substatus) {
          const subKey = `${status}__${lead.substatus}`;
          stats.bySubstatus[subKey] = (stats.bySubstatus[subKey] || 0) + 1;
        }

        // By Type
        if (lead.leadType === "loan") stats.byType.loan++;
        else if (lead.leadType === "investment") stats.byType.investment++;

        // Legal Stats
        if (lead.legalStatus === "pending_review") stats.legalStats.pending++;
        else if (lead.legalStatus === "approved") stats.legalStats.approved++;
        else if (lead.legalStatus === "rejected") stats.legalStats.rejected++;

        // Commercial Stats
        if (lead.commercialStatus === "pending_review")
          stats.commercialStats.pending++;
        else if (lead.commercialStatus === "approved")
          stats.commercialStats.approved++;
        else if (lead.commercialStatus === "rejected")
          stats.commercialStats.rejected++;

        // By Executive
        if (lead.assignedTo) {
          stats.byExecutive[lead.assignedTo] =
            (stats.byExecutive[lead.assignedTo] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error calculating global stats:", error);
      throw error;
    }
  },

  async getExecutiveStats(userId: string): Promise<{
    total: number;
    newLeads: number;
    appointments: number;
    pendingLegal: number;
    pendingCommercial: number;
  }> {
    try {
      const myLeads = await this.getLeadsByExecutive(userId);

      const stats = {
        total: myLeads.length,
        newLeads: 0,
        appointments: 0,
        pendingLegal: 0,
        pendingCommercial: 0,
      };

      myLeads.forEach((lead) => {
        if (lead.status === "nuevo") stats.newLeads++;
        if (lead.substatus === "cita") stats.appointments++;

        if (lead.legalStatus === "pending_review") stats.pendingLegal++;
        if (lead.commercialStatus === "pending_review")
          stats.pendingCommercial++;
      });

      return stats;
    } catch (error) {
      console.error("Error calculating executive stats:", error);
      throw error;
    }
  },

  async deleteAllLeads(): Promise<void> {
    try {
      const leadsSnapshot = await getDocs(collection(db, "leads"));
      if (leadsSnapshot.empty) return;

      const batch = writeBatch(db);
      leadsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting all leads:", error);
      throw error;
    }
  },
};
