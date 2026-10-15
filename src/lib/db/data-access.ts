/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/prisma";

type ModelDelegate = any;
const softDeleteModels = new Set([
  "user",
  "lead",
  "service",
  "project",
  "quotation",
  "document",
  "designAsset",
  "material",
  "portfolioProject",
  "costEstimate",
]);

function model(name: string): ModelDelegate {
  return (prisma as unknown as Record<string, ModelDelegate>)[name]!;
}

function create(name: string, data: object): Promise<any> {
  return model(name).create({ data });
}

function get(name: string, where: object): Promise<any> {
  const filteredWhere = softDeleteModels.has(name)
    ? { ...(where as Record<string, unknown>), deletedAt: null }
    : where;
  return model(name).findFirst({ where: filteredWhere });
}

function list(name: string, args?: object): Promise<any[]> {
  if (!softDeleteModels.has(name)) return model(name).findMany(args);
  const query = (args || {}) as Record<string, unknown>;
  return model(name).findMany({
    ...query,
    where: { ...((query.where || {}) as Record<string, unknown>), deletedAt: null },
  });
}

async function update(name: string, where: object, data: object): Promise<any> {
  const record = await get(name, where);
  if (!record || typeof record.id !== "string") throw new Error(`${name} record not found for update`);
  return model(name).update({ where: { id: record.id }, data });
}

async function archive(name: string, where: object): Promise<any> {
  return update(name, where, { deletedAt: new Date() });
}

async function remove(name: string, where: object): Promise<boolean> {
  const record = await get(name, where);
  if (!record || typeof record.id !== "string") return false;
  await model(name).delete({ where: { id: record.id } });
  return true;
}

export const createUser = (data: object) => create("user", data);
export const getUser = (where: object) => get("user", where);
export const listUsers = (args?: object) => list("user", args);
export const updateUser = (where: object, data: object) => update("user", where, data);
export const archiveUser = (where: object) => archive("user", where);

export const createLead = (data: object) => create("lead", data);
export const getLead = (where: object) => get("lead", where);
export const listLeads = (args?: object) => list("lead", args);
export const updateLead = (where: object, data: object) => update("lead", where, data);
export const archiveLead = (where: object) => archive("lead", where);

export const createProject = (data: object) => create("project", data);
export const getProject = (where: object) => get("project", where);
export const listProjects = (args?: object) => list("project", args);
export const updateProject = (where: object, data: object) => update("project", where, data);
export const archiveProject = (where: object) => archive("project", where);

export const createService = (data: object) => create("service", data);
export const getService = (where: object) => get("service", where);
export const listServices = (args?: object) => list("service", args);
export const updateService = (where: object, data: object) => update("service", where, data);
export const archiveService = (where: object) => archive("service", where);

export const createProjectService = (data: object) => create("projectService", data);
export const getProjectService = (where: object) => get("projectService", where);
export const listProjectServices = (args?: object) => list("projectService", args);
export const updateProjectService = (where: object, data: object) => update("projectService", where, data);
export const deleteProjectService = (where: object) => remove("projectService", where);

export const createQuotation = (data: object) => create("quotation", data);
export const createQuotationLineItem = (data: object) => create("quotationLineItem", data);
export const getQuotation = (where: object) => get("quotation", where);
export const listQuotations = (args?: object) => list("quotation", args);
export const updateQuotation = (where: object, data: object) => update("quotation", where, data);
export const archiveQuotation = (where: object) => archive("quotation", where);

export const createPayment = (data: object) => create("payment", data);
export const getPayment = (where: object) => get("payment", where);
export const listPayments = (args?: object) => list("payment", args);
export const updatePayment = (where: object, data: object) => update("payment", where, data);
export const deletePayment = (where: object) => remove("payment", where);

export const createDocument = (data: object) => create("document", data);
export const getDocument = (where: object) => get("document", where);
export const listDocuments = (args?: object) => list("document", args);
export const updateDocument = (where: object, data: object) => update("document", where, data);
export const archiveDocument = (where: object) => archive("document", where);

export const createDesignAsset = (data: object) => create("designAsset", data);
export const getDesignAsset = (where: object) => get("designAsset", where);
export const listDesignAssets = (args?: object) => list("designAsset", args);
export const updateDesignAsset = (where: object, data: object) => update("designAsset", where, data);
export const archiveDesignAsset = (where: object) => archive("designAsset", where);

export const createMaterial = (data: object) => create("material", data);
export const getMaterial = (where: object) => get("material", where);
export const listMaterials = (args?: object) => list("material", args);
export const updateMaterial = (where: object, data: object) => update("material", where, data);
export const archiveMaterial = (where: object) => archive("material", where);

export const createApproval = (data: object) => create("approval", data);
export const getApproval = (where: object) => get("approval", where);
export const listApprovals = (args?: object) => list("approval", args);
export const updateApproval = (where: object, data: object) => update("approval", where, data);
export const deleteApproval = (where: object) => remove("approval", where);

export const createMessage = (data: object) => create("message", data);
export const getMessage = (where: object) => get("message", where);
export const listMessages = (args?: object) => list("message", args);
export const updateMessage = (where: object, data: object) => update("message", where, data);
export const deleteMessage = (where: object) => remove("message", where);

export const createNotification = (data: object) => create("notification", data);
export const getNotification = (where: object) => get("notification", where);
export const listNotifications = (args?: object) => list("notification", args);
export const updateNotification = (where: object, data: object) => update("notification", where, data);
export const deleteNotification = (where: object) => remove("notification", where);

export const createCostEstimate = (data: object) => create("costEstimate", data);
export const getCostEstimate = (where: object) => get("costEstimate", where);
export const listCostEstimates = (args?: object) => list("costEstimate", args);
export const updateCostEstimate = (where: object, data: object) => update("costEstimate", where, data);
export const deleteCostEstimate = (where: object) => remove("costEstimate", where);

export const createPortfolioProject = (data: object) => create("portfolioProject", data);
export const getPortfolioProject = (where: object) => get("portfolioProject", where);
export const listPortfolioProjects = (args?: object) => list("portfolioProject", args);
export const updatePortfolioProject = (where: object, data: object) => update("portfolioProject", where, data);
export const archivePortfolioProject = (where: object) => archive("portfolioProject", where);

export const createActivityEvent = (data: object) => create("activityEvent", data);
export const getActivityEvent = (where: object) => get("activityEvent", where);
export const listActivityEvents = (args?: object) => list("activityEvent", args);
export const createDocumentVersion = (data: object) => create("documentVersion", data);
export const listDocumentVersions = (args?: object) => list("documentVersion", args);
export const createDesignVersion = (data: object) => create("designVersion", data);
export const listDesignVersions = (args?: object) => list("designVersion", args);

export const createProjectMilestone = (data: object) => create("projectMilestone", data);
export const getProjectMilestone = (where: object) => get("projectMilestone", where);
export const listProjectMilestones = (args?: object) => list("projectMilestone", args);
export const updateProjectMilestone = (where: object, data: object) => update("projectMilestone", where, data);
export const deleteProjectMilestone = (where: object) => remove("projectMilestone", where);

export const createProjectPhase = (data: object) => create("projectPhase", data);
export const getProjectPhase = (where: object) => get("projectPhase", where);
export const listProjectPhases = (args?: object) => list("projectPhase", args);
export const updateProjectPhase = (where: object, data: object) => update("projectPhase", where, data);
export const deleteProjectPhase = (where: object) => remove("projectPhase", where);

export const createGalleryMedia = (data: object) => create("galleryMedia", data);
export const listGalleryMedia = (args?: object) => list("galleryMedia", args);
export const deleteGalleryMedia = (where: object) => remove("galleryMedia", where);

export const createConversation = (data: object) => create("conversation", data);
export const listConversations = (args?: object) => list("conversation", args);
export const updateConversation = (where: object, data: object) => update("conversation", where, data);
export const archiveConversation = (where: object) => archive("conversation", where);
