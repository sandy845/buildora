import type { Prisma } from "@prisma/client";
import {
  archiveDesignAsset,
  archiveDocument,
  archiveLead,
  archiveMaterial,
  archiveProject,
  archiveProject as archiveProjectRecord,
  archiveQuotation,
  archiveService,
  createActivityEvent,
  createApproval,
  createCostEstimate,
  createDesignAsset,
  createDocument,
  createLead,
  createMaterial,
  createMessage,
  createNotification,
  createPayment,
  createPortfolioProject,
  createProject,
  createProject as createProjectRecord,
  createQuotation,
  createService,
  createUser,
  deleteApproval,
  deleteCostEstimate,
  deleteMessage,
  deleteNotification,
  deletePayment,
  deleteProjectService,
  getApproval,
  getCostEstimate,
  getDesignAsset,
  getDocument,
  getLead,
  getMaterial,
  getMessage,
  getNotification,
  getPayment,
  getPortfolioProject,
  getProject,
  getProject as getProjectRecord,
  getQuotation,
  getService,
  getActivityEvent,
  listActivityEvents,
  listApprovals,
  listCostEstimates,
  listDesignAssets,
  listDocuments,
  listLeads,
  listMaterials,
  listMessages,
  listNotifications,
  listPayments,
  listPortfolioProjects,
  createProjectService as createProjectServiceRecord,
  createQuotationLineItem,
  listProjectServices,
  listProjects,
  listQuotations,
  listServices,
  updateApproval,
  updateCostEstimate,
  updateDesignAsset,
  updateDocument,
  updateLead,
  updateMaterial,
  updateMessage,
  updateNotification,
  updatePayment,
  updatePortfolioProject,
  updateProject,
  updateProject as updateProjectRecord,
  updateQuotation,
  updateService,
  updateUser,
} from "../db/data-access.ts";
import { assertProjectAccess, assertProjectCustomer, requireEmail, requireId, requireObject, requirePatch, requirePositive, requireText, safeDatabaseOperation, ServiceError, type ServiceActor } from "./shared.ts";

export function createUserService(data: Prisma.UserCreateInput) {
  requireText(data.name, "name");
  requireEmail(data.email);
  requireEmail(data.normalizedEmail, "normalizedEmail");
  return safeDatabaseOperation(() => createUser(data));
}

export function updateUserService(id: string, data: Prisma.UserUpdateInput) {
  requirePatch(data);
  if (typeof data.email === "string") requireEmail(data.email);
  return safeDatabaseOperation(() => updateUser({ id: requireId(id, "userId") }, data));
}

export function createLeadService(data: Prisma.LeadCreateInput) {
  requireText(data.name, "name");
  requireEmail(data.email);
  requireText(data.phone, "phone");
  requireText(data.location, "location");
  requireText(data.projectBrief, "projectBrief");
  return safeDatabaseOperation(() => createLead(data));
}

export function getLeadService(id: string) {
  return getLead({ id: requireId(id, "leadId") });
}

export function listLeadService(args?: Parameters<typeof listLeads>[0]) {
  return listLeads(args);
}

export function updateLeadService(id: string, data: Prisma.LeadUpdateInput) {
  requirePatch(data);
  return safeDatabaseOperation(() => updateLead({ id: requireId(id, "leadId") }, data));
}

export function archiveLeadService(id: string) {
  return archiveLead({ id: requireId(id, "leadId") });
}

export function createProjectService(actor: ServiceActor, data: Omit<Prisma.ProjectCreateInput, "customer"> & { customerId: string }) {
  requireText(data.name, "name");
  requireText(data.slug, "slug");
  assertProjectCustomer(actor, data.customerId);
  const { customerId, ...projectData } = data;
  return safeDatabaseOperation(() => createProjectRecord({ ...projectData, customer: { connect: { id: customerId } } }));
}

export async function getProjectService(actor: ServiceActor, id: string) {
  return assertProjectAccess(actor, id);
}

export function listProjectService(actor: ServiceActor, args?: Omit<Prisma.ProjectFindManyArgs, "where">) {
  const where: Prisma.ProjectWhereInput = actor.role === "admin" ? {} : { customerId: actor.id };
  return listProjects({ ...args, where });
}

export async function updateProjectService(actor: ServiceActor, id: string, data: Prisma.ProjectUpdateInput) {
  await assertProjectAccess(actor, id);
  requirePatch(data);
  return safeDatabaseOperation(() => updateProjectRecord({ id }, data));
}

export async function archiveProjectService(actor: ServiceActor, id: string) {
  await assertProjectAccess(actor, id);
  return archiveProjectRecord({ id });
}

export function createServiceService(data: Prisma.ServiceCreateInput) {
  requireText(data.name, "name");
  requireText(data.slug, "slug");
  return safeDatabaseOperation(() => createService(data));
}

export function getServiceService(id: string) {
  return getService({ id: requireId(id, "serviceId") });
}

export function listServiceService(args?: Parameters<typeof listServices>[0]) {
  return listServices(args);
}

export function updateServiceService(id: string, data: Prisma.ServiceUpdateInput) {
  requirePatch(data);
  return safeDatabaseOperation(() => updateService({ id: requireId(id, "serviceId") }, data));
}

export function archiveServiceService(id: string) {
  return archiveService({ id: requireId(id, "serviceId") });
}

export async function createProjectServiceLink(actor: ServiceActor, projectId: string, data: Omit<Prisma.ProjectServiceCreateInput, "project">) {
  await assertProjectAccess(actor, projectId);
  return createProjectServiceRecord({ ...data, project: { connect: { id: projectId } } });
}

export async function listProjectServiceLinks(actor: ServiceActor, projectId: string, args?: Omit<Prisma.ProjectServiceFindManyArgs, "where">) {
  await assertProjectAccess(actor, projectId);
  return listProjectServices({ ...args, where: { projectId } });
}

export async function deleteProjectServiceLink(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return deleteProjectService({ id: requireId(id, "projectServiceId") });
}

export async function createQuotationService(actor: ServiceActor, projectId: string, data: Omit<Prisma.QuotationCreateInput, "project">) {
  await assertProjectAccess(actor, projectId);
  requireText(data.quotationNumber, "quotationNumber");
  return safeDatabaseOperation(() => createQuotation({ ...data, project: { connect: { id: projectId } } }));
}

export async function createQuotationLineItemService(actor: ServiceActor, projectId: string, data: Omit<Prisma.QuotationLineItemCreateInput, "quotation"> & { quotationId: string }) {
  await assertProjectAccess(actor, projectId);
  requireText(data.description, "description");
  const { quotationId, ...lineItemData } = data;
  return safeDatabaseOperation(() => createQuotationLineItem({ ...lineItemData, quotation: { connect: { id: requireId(quotationId, "quotationId") } } }));
}

export async function getQuotationService(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return getQuotation({ id: requireId(id, "quotationId") });
}

export async function listQuotationService(actor: ServiceActor, projectId: string, args?: Omit<Prisma.QuotationFindManyArgs, "where">) {
  await assertProjectAccess(actor, projectId);
  return listQuotations({ ...args, where: { projectId } });
}

export async function updateQuotationService(actor: ServiceActor, projectId: string, id: string, data: Prisma.QuotationUpdateInput) {
  await assertProjectAccess(actor, projectId);
  requirePatch(data);
  return updateQuotation({ id }, data);
}

export async function archiveQuotationService(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return archiveQuotation({ id });
}

export async function createPaymentService(actor: ServiceActor, projectId: string, data: Omit<Prisma.PaymentCreateInput, "project">) {
  await assertProjectAccess(actor, projectId);
  requireText(data.currency, "currency");
  return safeDatabaseOperation(() => createPayment({ ...data, project: { connect: { id: projectId } } }));
}

export async function listPaymentService(actor: ServiceActor, projectId: string, args?: Omit<Prisma.PaymentFindManyArgs, "where">) {
  await assertProjectAccess(actor, projectId);
  return listPayments({ ...args, where: { projectId } });
}

export async function updatePaymentService(actor: ServiceActor, projectId: string, id: string, data: Prisma.PaymentUpdateInput) {
  await assertProjectAccess(actor, projectId);
  requirePatch(data);
  return updatePayment({ id }, data);
}

export async function deletePaymentService(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return deletePayment({ id });
}

export async function createDocumentService(actor: ServiceActor, projectId: string, data: Omit<Prisma.DocumentCreateInput, "project">) {
  await assertProjectAccess(actor, projectId);
  requireText(data.name, "name");
  return safeDatabaseOperation(() => createDocument({ ...data, project: { connect: { id: projectId } } }));
}

export async function listDocumentService(actor: ServiceActor, projectId: string, args?: Omit<Prisma.DocumentFindManyArgs, "where">) {
  await assertProjectAccess(actor, projectId);
  return listDocuments({ ...args, where: { projectId } });
}

export async function updateDocumentService(actor: ServiceActor, projectId: string, id: string, data: Prisma.DocumentUpdateInput) {
  await assertProjectAccess(actor, projectId);
  requirePatch(data);
  return updateDocument({ id }, data);
}

export async function archiveDocumentService(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return archiveDocument({ id });
}

export async function createDesignService(actor: ServiceActor, projectId: string, data: Omit<Prisma.DesignAssetCreateInput, "project">) {
  await assertProjectAccess(actor, projectId);
  requireText(data.name, "name");
  return safeDatabaseOperation(() => createDesignAsset({ ...data, project: { connect: { id: projectId } } }));
}

export async function listDesignService(actor: ServiceActor, projectId: string, args?: Omit<Prisma.DesignAssetFindManyArgs, "where">) {
  await assertProjectAccess(actor, projectId);
  return listDesignAssets({ ...args, where: { projectId } });
}

export async function updateDesignService(actor: ServiceActor, projectId: string, id: string, data: Prisma.DesignAssetUpdateInput) {
  await assertProjectAccess(actor, projectId);
  requirePatch(data);
  return updateDesignAsset({ id }, data);
}

export async function archiveDesignService(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return archiveDesignAsset({ id });
}

export function createMaterialService(data: Prisma.MaterialCreateInput) {
  requireText(data.name, "name");
  return safeDatabaseOperation(() => createMaterial(data));
}

export function getMaterialService(id: string) {
  return getMaterial({ id: requireId(id, "materialId") });
}

export function listMaterialService(args?: Parameters<typeof listMaterials>[0]) {
  return listMaterials(args);
}

export function updateMaterialService(id: string, data: Prisma.MaterialUpdateInput) {
  requirePatch(data);
  return updateMaterial({ id: requireId(id, "materialId") }, data);
}

export function archiveMaterialService(id: string) {
  return archiveMaterial({ id: requireId(id, "materialId") });
}

export async function createApprovalService(actor: ServiceActor, projectId: string, data: Omit<Prisma.ApprovalCreateInput, "project">) {
  await assertProjectAccess(actor, projectId);
  requireText(data.targetType, "targetType");
  return safeDatabaseOperation(() => createApproval({ ...data, project: { connect: { id: projectId } } }));
}

export async function listApprovalService(actor: ServiceActor, projectId: string, args?: Omit<Prisma.ApprovalFindManyArgs, "where">) {
  await assertProjectAccess(actor, projectId);
  return listApprovals({ ...args, where: { projectId } });
}

export async function updateApprovalService(actor: ServiceActor, projectId: string, id: string, data: Prisma.ApprovalUpdateInput) {
  await assertProjectAccess(actor, projectId);
  requirePatch(data);
  return updateApproval({ id }, data);
}

export async function deleteApprovalService(actor: ServiceActor, projectId: string, id: string) {
  await assertProjectAccess(actor, projectId);
  return deleteApproval({ id });
}

export async function createMessageService(actor: ServiceActor, projectId: string, data: Omit<Prisma.MessageCreateInput, "conversation"> & { conversationId: string }) {
  await assertProjectAccess(actor, projectId);
  requireText(data.body, "body");
  const { conversationId, ...messageData } = data;
  return safeDatabaseOperation(() => createMessage({ ...messageData, conversation: { connect: { id: conversationId } } }));
}

async function assertMessageAccess(actor: ServiceActor, projectId: string, messageId: string) {
  await assertProjectAccess(actor, projectId);
  const messages = await listMessages({ where: { id: requireId(messageId, "messageId"), conversation: { projectId } }, take: 1 });
  if (!messages[0]) throw new ServiceError("Message not found.", "NOT_FOUND");
}

export async function listMessageService(actor: ServiceActor, projectId: string, args?: Prisma.MessageFindManyArgs) {
  await assertProjectAccess(actor, projectId);
  return listMessages({ ...args, where: { ...args?.where, conversation: { projectId } } });
}

export async function updateMessageService(actor: ServiceActor, projectId: string, id: string, data: Prisma.MessageUpdateInput) {
  await assertMessageAccess(actor, projectId, id);
  requirePatch(data);
  return safeDatabaseOperation(() => updateMessage({ id: requireId(id, "messageId") }, data));
}

export async function deleteMessageService(actor: ServiceActor, projectId: string, id: string) {
  await assertMessageAccess(actor, projectId, id);
  return safeDatabaseOperation(() => deleteMessage({ id: requireId(id, "messageId") }));
}

export function createNotificationService(data: Prisma.NotificationCreateInput) {
  requireText(data.title, "title");
  requireText(data.body, "body");
  return safeDatabaseOperation(() => createNotification(data));
}

export function listNotificationService(actor: ServiceActor, userId: string, args?: Prisma.NotificationFindManyArgs) {
  if (actor.role !== "admin" && actor.id !== userId) throw new ServiceError("You cannot access these notifications.", "FORBIDDEN");
  return listNotifications({ ...args, where: { ...args?.where, userId: requireId(userId, "userId") } });
}

export function updateNotificationService(actor: ServiceActor, userId: string, id: string, data: Prisma.NotificationUpdateInput) {
  if (actor.role !== "admin" && actor.id !== userId) throw new ServiceError("You cannot update these notifications.", "FORBIDDEN");
  requirePatch(data);
  return safeDatabaseOperation(() => updateNotification({ id: requireId(id, "notificationId") }, data));
}

export function deleteNotificationService(actor: ServiceActor, userId: string, id: string) {
  if (actor.role !== "admin" && actor.id !== userId) throw new ServiceError("You cannot delete these notifications.", "FORBIDDEN");
  return safeDatabaseOperation(() => deleteNotification({ id: requireId(id, "notificationId") }));
}

export async function createCostEstimateService(actor: ServiceActor, data: Prisma.CostEstimateCreateInput) {
  if (data.project?.connect?.id) {
    await assertProjectAccess(actor, data.project.connect.id);
  }
  requireObject(data.inputs, "inputs");
  return safeDatabaseOperation(() => createCostEstimate(data));
}

export function getCostEstimateService(id: string) {
  return getCostEstimate({ id: requireId(id, "costEstimateId") });
}

export function listCostEstimateService(args?: Prisma.CostEstimateFindManyArgs) {
  return listCostEstimates(args);
}

export function updateCostEstimateService(id: string, data: Prisma.CostEstimateUpdateInput) {
  requirePatch(data);
  return updateCostEstimate({ id: requireId(id, "costEstimateId") }, data);
}

export function deleteCostEstimateService(id: string) {
  return deleteCostEstimate({ id: requireId(id, "costEstimateId") });
}

export function createPortfolioProjectService(data: Prisma.PortfolioProjectCreateInput) {
  requireText(data.title, "title");
  requireText(data.slug, "slug");
  return createPortfolioProject(data);
}

export function getPortfolioProjectService(id: string) {
  return getPortfolioProject({ id: requireId(id, "portfolioProjectId") });
}

export function listPortfolioProjectService<T extends Prisma.PortfolioProjectFindManyArgs>(args?: T) {
  return listPortfolioProjects(args);
}

export function updatePortfolioProjectService(id: string, data: Prisma.PortfolioProjectUpdateInput) {
  requirePatch(data);
  return updatePortfolioProject({ id: requireId(id, "portfolioProjectId") }, data);
}

export function archivePortfolioProjectService(id: string) {
  return updatePortfolioProject({ id: requireId(id, "portfolioProjectId") }, { deletedAt: new Date() });
}

export function createActivityEventService(data: Prisma.ActivityEventCreateInput) {
  requireText(data.entityType, "entityType");
  requireText(data.entityId, "entityId");
  return createActivityEvent(data);
}

export function getActivityEventService(id: string) {
  return getActivityEvent({ id: requireId(id, "activityEventId") });
}

export function listActivityEventService(args?: Parameters<typeof listActivityEvents>[0]) {
  return listActivityEvents(args);
}

export { requirePositive };
