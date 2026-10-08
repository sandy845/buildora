/**
 * Firestore-backed Data Access Layer
 * Replaces Prisma ORM with Firebase Cloud Firestore collections.
 */

import {
  firestoreCreate,
  firestoreGet,
  firestoreFind,
  firestoreFindOne,
  firestoreUpdate,
  firestoreSoftDelete,
  firestoreHardDelete,
  type QueryFilter,
  type QueryOptions,
} from "@/lib/firebase/firestore";

import type {
  User,
  Lead,
  Project,
  Service,
  Quotation,
  Payment,
  Document,
  DesignAsset,
  Material,
  Approval,
  Notification,
  Message,
  CostEstimate,
  PortfolioProject,
  ActivityEvent,
  ProjectMilestone,
  ProjectPhase,
  GalleryMedia,
} from "@/lib/types/models";

// Helper to convert Prisma-style where object into Firestore QueryOptions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreOptions(args?: any): QueryOptions {
  if (!args) return {};
  const options: QueryOptions = {};
  const filters: QueryFilter[] = [];

  if (args.where) {
    for (const [key, val] of Object.entries(args.where)) {
      if (val === undefined || key === "deletedAt") continue;

      if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = val as Record<string, any>;
        if ("equals" in sub) {
          filters.push({ field: key, operator: "==", value: sub.equals });
        } else if ("in" in sub && Array.isArray(sub.in)) {
          filters.push({ field: key, operator: "in", value: sub.in });
        } else if ("not" in sub) {
          filters.push({ field: key, operator: "!=", value: sub.not });
        }
      } else {
        filters.push({ field: key, operator: "==", value: val });
      }
    }
  }

  if (filters.length > 0) {
    options.where = filters;
  }

  if (args.orderBy) {
    const orderObj = Array.isArray(args.orderBy) ? args.orderBy[0] : args.orderBy;
    if (orderObj) {
      const entry = Object.entries(orderObj)[0];
      if (entry) {
        options.orderBy = {
          field: entry[0],
          direction: String(entry[1]).toLowerCase() === "desc" ? "desc" : "asc",
        };
      }
    }
  }

  if (args.take) {
    options.limit = args.take;
  }

  return options;
}

// Helper to resolve an ID or find unique by field
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findUnique<T>(collection: string, where: any): Promise<T | null> {
  if (!where) return null;
  if (where.id) {
    return firestoreGet<T & { id: string }>(collection, where.id);
  }
  const opts = toFirestoreOptions({ where });
  return firestoreFindOne<T & { id: string }>(collection, opts);
}

// Helper to resolve ID for update/delete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveId(collection: string, where: any): Promise<string | null> {
  if (!where) return null;
  if (where.id) return where.id;
  const found = await findUnique<{ id: string }>(collection, where);
  return found?.id || null;
}

// ==========================================
// 1. Users
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createUser(data: any): Promise<User> {
  return firestoreCreate<User>("users", data, data.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUser(where: any): Promise<User | null> {
  return findUnique<User>("users", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listUsers(args?: any): Promise<User[]> {
  return firestoreFind<User>("users", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUser(where: any, data: any): Promise<User> {
  const id = await resolveId("users", where);
  if (!id) throw new Error("User not found for update");
  return firestoreUpdate("users", id, data) as Promise<User>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveUser(where: any): Promise<User> {
  const id = await resolveId("users", where);
  if (!id) throw new Error("User not found for archive");
  return firestoreSoftDelete("users", id) as Promise<User>;
}

// ==========================================
// 2. Leads
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createLead(data: any): Promise<Lead> {
  const { service, ...leadData } = data;
  const serviceId = service?.connect?.id;
  return firestoreCreate<Lead>(
    "leads",
    serviceId ? { ...leadData, serviceId } : leadData
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLead(where: any): Promise<Lead | null> {
  return findUnique<Lead>("leads", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listLeads(args?: any): Promise<Lead[]> {
  return firestoreFind<Lead>("leads", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateLead(where: any, data: any): Promise<Lead> {
  const id = await resolveId("leads", where);
  if (!id) throw new Error("Lead not found for update");
  return firestoreUpdate("leads", id, data) as Promise<Lead>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveLead(where: any): Promise<Lead> {
  const id = await resolveId("leads", where);
  if (!id) throw new Error("Lead not found for archive");
  return firestoreSoftDelete("leads", id) as Promise<Lead>;
}

// ==========================================
// 3. Projects
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProject(data: any): Promise<Project> {
  return firestoreCreate<Project>("projects", data, data.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProject(where: any): Promise<Project | null> {
  return findUnique<Project>("projects", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listProjects(args?: any): Promise<Project[]> {
  return firestoreFind<Project>("projects", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProject(where: any, data: any): Promise<Project> {
  const id = await resolveId("projects", where);
  if (!id) throw new Error("Project not found for update");
  return firestoreUpdate("projects", id, data) as Promise<Project>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveProject(where: any): Promise<Project> {
  const id = await resolveId("projects", where);
  if (!id) throw new Error("Project not found for archive");
  return firestoreSoftDelete("projects", id) as Promise<Project>;
}

// ==========================================
// 4. Services
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createService(data: any): Promise<Service> {
  return firestoreCreate<Service>("services", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getService(where: any): Promise<Service | null> {
  return findUnique<Service>("services", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listServices(args?: any): Promise<Service[]> {
  return firestoreFind<Service>("services", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateService(where: any, data: any): Promise<Service> {
  const id = await resolveId("services", where);
  if (!id) throw new Error("Service not found for update");
  return firestoreUpdate("services", id, data) as Promise<Service>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveService(where: any): Promise<Service> {
  const id = await resolveId("services", where);
  if (!id) throw new Error("Service not found for archive");
  return firestoreSoftDelete("services", id) as Promise<Service>;
}

// ==========================================
// 5. Project Services
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProjectService(data: any) {
  return firestoreCreate("projectServices", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProjectService(where: any) {
  return findUnique("projectServices", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listProjectServices(args?: any) {
  return firestoreFind("projectServices", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProjectService(where: any, data: any) {
  const id = await resolveId("projectServices", where);
  if (!id) throw new Error("ProjectService not found for update");
  return firestoreUpdate("projectServices", id, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteProjectService(where: any) {
  const id = await resolveId("projectServices", where);
  if (!id) return false;
  return firestoreHardDelete("projectServices", id);
}

// ==========================================
// 6. Quotations & Line Items
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createQuotation(data: any): Promise<Quotation> {
  return firestoreCreate<Quotation>("quotations", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createQuotationLineItem(data: any) {
  return firestoreCreate("quotationLineItems", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getQuotation(where: any): Promise<Quotation | null> {
  return findUnique<Quotation>("quotations", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listQuotations(args?: any): Promise<Quotation[]> {
  return firestoreFind<Quotation>("quotations", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateQuotation(where: any, data: any): Promise<Quotation> {
  const id = await resolveId("quotations", where);
  if (!id) throw new Error("Quotation not found for update");
  return firestoreUpdate("quotations", id, data) as Promise<Quotation>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveQuotation(where: any): Promise<Quotation> {
  const id = await resolveId("quotations", where);
  if (!id) throw new Error("Quotation not found for archive");
  return firestoreSoftDelete("quotations", id) as Promise<Quotation>;
}

// ==========================================
// 7. Payments
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPayment(data: any): Promise<Payment> {
  return firestoreCreate<Payment>("payments", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPayment(where: any): Promise<Payment | null> {
  return findUnique<Payment>("payments", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listPayments(args?: any): Promise<Payment[]> {
  return firestoreFind<Payment>("payments", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePayment(where: any, data: any): Promise<Payment> {
  const id = await resolveId("payments", where);
  if (!id) throw new Error("Payment not found for update");
  return firestoreUpdate("payments", id, data) as Promise<Payment>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deletePayment(where: any): Promise<boolean> {
  const id = await resolveId("payments", where);
  if (!id) return false;
  return firestoreHardDelete("payments", id);
}

// ==========================================
// 8. Documents
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDocument(data: any): Promise<Document> {
  return firestoreCreate<Document>("documents", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDocument(where: any): Promise<Document | null> {
  return findUnique<Document>("documents", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listDocuments(args?: any): Promise<Document[]> {
  return firestoreFind<Document>("documents", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateDocument(where: any, data: any): Promise<Document> {
  const id = await resolveId("documents", where);
  if (!id) throw new Error("Document not found for update");
  return firestoreUpdate("documents", id, data) as Promise<Document>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveDocument(where: any): Promise<Document> {
  const id = await resolveId("documents", where);
  if (!id) throw new Error("Document not found for archive");
  return firestoreSoftDelete("documents", id) as Promise<Document>;
}

// ==========================================
// 9. Design Assets
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDesignAsset(data: any): Promise<DesignAsset> {
  return firestoreCreate<DesignAsset>("designAssets", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDesignAsset(where: any): Promise<DesignAsset | null> {
  return findUnique<DesignAsset>("designAssets", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listDesignAssets(args?: any): Promise<DesignAsset[]> {
  return firestoreFind<DesignAsset>("designAssets", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateDesignAsset(where: any, data: any): Promise<DesignAsset> {
  const id = await resolveId("designAssets", where);
  if (!id) throw new Error("DesignAsset not found for update");
  return firestoreUpdate("designAssets", id, data) as Promise<DesignAsset>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveDesignAsset(where: any): Promise<DesignAsset> {
  const id = await resolveId("designAssets", where);
  if (!id) throw new Error("DesignAsset not found for archive");
  return firestoreSoftDelete("designAssets", id) as Promise<DesignAsset>;
}

// ==========================================
// 10. Materials
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMaterial(data: any): Promise<Material> {
  return firestoreCreate<Material>("materials", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMaterial(where: any): Promise<Material | null> {
  return findUnique<Material>("materials", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listMaterials(args?: any): Promise<Material[]> {
  return firestoreFind<Material>("materials", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateMaterial(where: any, data: any): Promise<Material> {
  const id = await resolveId("materials", where);
  if (!id) throw new Error("Material not found for update");
  return firestoreUpdate("materials", id, data) as Promise<Material>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveMaterial(where: any): Promise<Material> {
  const id = await resolveId("materials", where);
  if (!id) throw new Error("Material not found for archive");
  return firestoreSoftDelete("materials", id) as Promise<Material>;
}

// ==========================================
// 11. Approvals
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createApproval(data: any): Promise<Approval> {
  return firestoreCreate<Approval>("approvals", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getApproval(where: any): Promise<Approval | null> {
  return findUnique<Approval>("approvals", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listApprovals(args?: any): Promise<Approval[]> {
  return firestoreFind<Approval>("approvals", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateApproval(where: any, data: any): Promise<Approval> {
  const id = await resolveId("approvals", where);
  if (!id) throw new Error("Approval not found for update");
  return firestoreUpdate("approvals", id, data) as Promise<Approval>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteApproval(where: any): Promise<boolean> {
  const id = await resolveId("approvals", where);
  if (!id) return false;
  return firestoreHardDelete("approvals", id);
}

// ==========================================
// 12. Messages
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMessage(data: any): Promise<Message> {
  return firestoreCreate<Message>("messages", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMessage(where: any): Promise<Message | null> {
  return findUnique<Message>("messages", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listMessages(args?: any): Promise<Message[]> {
  return firestoreFind<Message>("messages", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateMessage(where: any, data: any): Promise<Message> {
  const id = await resolveId("messages", where);
  if (!id) throw new Error("Message not found for update");
  return firestoreUpdate("messages", id, data) as Promise<Message>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteMessage(where: any): Promise<boolean> {
  const id = await resolveId("messages", where);
  if (!id) return false;
  return firestoreHardDelete("messages", id);
}

// ==========================================
// 13. Notifications
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createNotification(data: any): Promise<Notification> {
  return firestoreCreate<Notification>("notifications", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getNotification(where: any): Promise<Notification | null> {
  return findUnique<Notification>("notifications", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listNotifications(args?: any): Promise<Notification[]> {
  return firestoreFind<Notification>("notifications", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateNotification(where: any, data: any): Promise<Notification> {
  const id = await resolveId("notifications", where);
  if (!id) throw new Error("Notification not found for update");
  return firestoreUpdate("notifications", id, data) as Promise<Notification>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteNotification(where: any): Promise<boolean> {
  const id = await resolveId("notifications", where);
  if (!id) return false;
  return firestoreHardDelete("notifications", id);
}

// ==========================================
// 14. Cost Estimates
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createCostEstimate(data: any): Promise<CostEstimate> {
  return firestoreCreate<CostEstimate>("costEstimates", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCostEstimate(where: any): Promise<CostEstimate | null> {
  return findUnique<CostEstimate>("costEstimates", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listCostEstimates(args?: any): Promise<CostEstimate[]> {
  return firestoreFind<CostEstimate>("costEstimates", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateCostEstimate(where: any, data: any): Promise<CostEstimate> {
  const id = await resolveId("costEstimates", where);
  if (!id) throw new Error("CostEstimate not found for update");
  return firestoreUpdate("costEstimates", id, data) as Promise<CostEstimate>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteCostEstimate(where: any): Promise<boolean> {
  const id = await resolveId("costEstimates", where);
  if (!id) return false;
  return firestoreHardDelete("costEstimates", id);
}

// ==========================================
// 15. Portfolio Projects
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPortfolioProject(data: any): Promise<PortfolioProject> {
  return firestoreCreate<PortfolioProject>("portfolioProjects", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPortfolioProject(where: any): Promise<PortfolioProject | null> {
  return findUnique<PortfolioProject>("portfolioProjects", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listPortfolioProjects(args?: any): Promise<PortfolioProject[]> {
  return firestoreFind<PortfolioProject>("portfolioProjects", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePortfolioProject(where: any, data: any): Promise<PortfolioProject> {
  const id = await resolveId("portfolioProjects", where);
  if (!id) throw new Error("PortfolioProject not found for update");
  return firestoreUpdate("portfolioProjects", id, data) as Promise<PortfolioProject>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archivePortfolioProject(where: any): Promise<PortfolioProject> {
  const id = await resolveId("portfolioProjects", where);
  if (!id) throw new Error("PortfolioProject not found for archive");
  return firestoreSoftDelete("portfolioProjects", id) as Promise<PortfolioProject>;
}

// ==========================================
// 16. Activity Events
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createActivityEvent(data: any): Promise<ActivityEvent> {
  return firestoreCreate<ActivityEvent>("activityEvents", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getActivityEvent(where: any): Promise<ActivityEvent | null> {
  return findUnique<ActivityEvent>("activityEvents", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listActivityEvents(args?: any): Promise<ActivityEvent[]> {
  return firestoreFind<ActivityEvent>("activityEvents", toFirestoreOptions(args));
}

// ==========================================
// 17. Document / Design Versions & Milestones
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDocumentVersion(data: any) {
  return firestoreCreate("documentVersions", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listDocumentVersions(args?: any) {
  return firestoreFind("documentVersions", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDesignVersion(data: any) {
  return firestoreCreate("designVersions", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listDesignVersions(args?: any) {
  return firestoreFind("designVersions", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProjectMilestone(data: any): Promise<ProjectMilestone> {
  return firestoreCreate<ProjectMilestone>("projectMilestones", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProjectMilestone(where: any): Promise<ProjectMilestone | null> {
  return findUnique<ProjectMilestone>("projectMilestones", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listProjectMilestones(args?: any): Promise<ProjectMilestone[]> {
  return firestoreFind<ProjectMilestone>("projectMilestones", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProjectMilestone(where: any, data: any): Promise<ProjectMilestone> {
  const id = await resolveId("projectMilestones", where);
  if (!id) throw new Error("ProjectMilestone not found for update");
  return firestoreUpdate("projectMilestones", id, data) as Promise<ProjectMilestone>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteProjectMilestone(where: any): Promise<boolean> {
  const id = await resolveId("projectMilestones", where);
  if (!id) return false;
  return firestoreHardDelete("projectMilestones", id);
}

// ==========================================
// 18. Project Phases & Gallery Media
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProjectPhase(data: any): Promise<ProjectPhase> {
  return firestoreCreate<ProjectPhase>("projectPhases", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProjectPhase(where: any): Promise<ProjectPhase | null> {
  return findUnique<ProjectPhase>("projectPhases", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listProjectPhases(args?: any): Promise<ProjectPhase[]> {
  return firestoreFind<ProjectPhase>("projectPhases", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProjectPhase(where: any, data: any): Promise<ProjectPhase> {
  const id = await resolveId("projectPhases", where);
  if (!id) throw new Error("ProjectPhase not found for update");
  return firestoreUpdate("projectPhases", id, data) as Promise<ProjectPhase>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteProjectPhase(where: any): Promise<boolean> {
  const id = await resolveId("projectPhases", where);
  if (!id) return false;
  return firestoreHardDelete("projectPhases", id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createGalleryMedia(data: any): Promise<GalleryMedia> {
  return firestoreCreate<GalleryMedia>("galleryMedia", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listGalleryMedia(args?: any): Promise<GalleryMedia[]> {
  return firestoreFind<GalleryMedia>("galleryMedia", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteGalleryMedia(where: any): Promise<boolean> {
  const id = await resolveId("galleryMedia", where);
  if (!id) return false;
  return firestoreHardDelete("galleryMedia", id);
}

// ==========================================
// 19. Conversations
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createConversation(data: any) {
  return firestoreCreate("conversations", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getConversation(where: any) {
  return findUnique("conversations", where);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listConversations(args?: any) {
  return firestoreFind("conversations", toFirestoreOptions(args));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateConversation(where: any, data: any) {
  const id = await resolveId("conversations", where);
  if (!id) throw new Error("Conversation not found for update");
  return firestoreUpdate("conversations", id, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function archiveConversation(where: any) {
  const id = await resolveId("conversations", where);
  if (!id) throw new Error("Conversation not found for archive");
  return firestoreSoftDelete("conversations", id);
}
