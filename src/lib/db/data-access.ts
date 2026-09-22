import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.ts";



const activeRecord = { deletedAt: null } as const;

export function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export function getUser(where: Prisma.UserWhereUniqueInput) {
  return prisma.user.findUnique({ where });
}

export function listUsers(args?: Omit<Prisma.UserFindManyArgs, "where"> & { where?: Prisma.UserWhereInput }) {
  return prisma.user.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateUser(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where, data });
}

export function archiveUser(where: Prisma.UserWhereUniqueInput) {
  return prisma.user.update({ where, data: { deletedAt: new Date() } });
}

export function createLead(data: Prisma.LeadCreateInput) {
  return prisma.lead.create({ data });
}

export function getLead(where: Prisma.LeadWhereUniqueInput) {
  return prisma.lead.findUnique({ where });
}

export function listLeads(args?: Omit<Prisma.LeadFindManyArgs, "where"> & { where?: Prisma.LeadWhereInput }) {
  return prisma.lead.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateLead(where: Prisma.LeadWhereUniqueInput, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({ where, data });
}

export function archiveLead(where: Prisma.LeadWhereUniqueInput) {
  return prisma.lead.update({ where, data: { deletedAt: new Date() } });
}

export function createProject(data: Prisma.ProjectCreateInput) {
  return prisma.project.create({ data });
}

export function getProject(where: Prisma.ProjectWhereUniqueInput) {
  return prisma.project.findUnique({ where });
}

export function listProjects(args?: Omit<Prisma.ProjectFindManyArgs, "where"> & { where?: Prisma.ProjectWhereInput }) {
  return prisma.project.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateProject(where: Prisma.ProjectWhereUniqueInput, data: Prisma.ProjectUpdateInput) {
  return prisma.project.update({ where, data });
}

export function archiveProject(where: Prisma.ProjectWhereUniqueInput) {
  return prisma.project.update({ where, data: { deletedAt: new Date() } });
}

export function createService(data: Prisma.ServiceCreateInput) {
  return prisma.service.create({ data });
}

export function getService(where: Prisma.ServiceWhereUniqueInput) {
  return prisma.service.findUnique({ where });
}

export function listServices(args?: Omit<Prisma.ServiceFindManyArgs, "where"> & { where?: Prisma.ServiceWhereInput }) {
  return prisma.service.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateService(where: Prisma.ServiceWhereUniqueInput, data: Prisma.ServiceUpdateInput) {
  return prisma.service.update({ where, data });
}

export function archiveService(where: Prisma.ServiceWhereUniqueInput) {
  return prisma.service.update({ where, data: { deletedAt: new Date() } });
}

export function createProjectService(data: Prisma.ProjectServiceCreateInput) {
  return prisma.projectService.create({ data });
}

export function getProjectService(where: Prisma.ProjectServiceWhereUniqueInput) {
  return prisma.projectService.findUnique({ where });
}

export function listProjectServices(args?: Prisma.ProjectServiceFindManyArgs) {
  return prisma.projectService.findMany(args);
}

export function updateProjectService(where: Prisma.ProjectServiceWhereUniqueInput, data: Prisma.ProjectServiceUpdateInput) {
  return prisma.projectService.update({ where, data });
}

export function deleteProjectService(where: Prisma.ProjectServiceWhereUniqueInput) {
  return prisma.projectService.delete({ where });
}

export function createQuotation(data: Prisma.QuotationCreateInput) {
  return prisma.quotation.create({ data });
}

export function createQuotationLineItem(data: Prisma.QuotationLineItemCreateInput) {
  return prisma.quotationLineItem.create({ data });
}

export function getQuotation(where: Prisma.QuotationWhereUniqueInput) {
  return prisma.quotation.findUnique({ where });
}

export function listQuotations(args?: Omit<Prisma.QuotationFindManyArgs, "where"> & { where?: Prisma.QuotationWhereInput }) {
  return prisma.quotation.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateQuotation(where: Prisma.QuotationWhereUniqueInput, data: Prisma.QuotationUpdateInput) {
  return prisma.quotation.update({ where, data });
}

export function archiveQuotation(where: Prisma.QuotationWhereUniqueInput) {
  return prisma.quotation.update({ where, data: { deletedAt: new Date() } });
}

export function createPayment(data: Prisma.PaymentCreateInput) {
  return prisma.payment.create({ data });
}

export function getPayment(where: Prisma.PaymentWhereUniqueInput) {
  return prisma.payment.findUnique({ where });
}

export function listPayments(args?: Prisma.PaymentFindManyArgs) {
  return prisma.payment.findMany(args);
}

export function updatePayment(where: Prisma.PaymentWhereUniqueInput, data: Prisma.PaymentUpdateInput) {
  return prisma.payment.update({ where, data });
}

export function deletePayment(where: Prisma.PaymentWhereUniqueInput) {
  return prisma.payment.delete({ where });
}

export function createDocument(data: Prisma.DocumentCreateInput) {
  return prisma.document.create({ data });
}

export function getDocument(where: Prisma.DocumentWhereUniqueInput) {
  return prisma.document.findUnique({ where });
}

export function listDocuments(args?: Omit<Prisma.DocumentFindManyArgs, "where"> & { where?: Prisma.DocumentWhereInput }) {
  return prisma.document.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateDocument(where: Prisma.DocumentWhereUniqueInput, data: Prisma.DocumentUpdateInput) {
  return prisma.document.update({ where, data });
}

export function archiveDocument(where: Prisma.DocumentWhereUniqueInput) {
  return prisma.document.update({ where, data: { deletedAt: new Date() } });
}

export function createDesignAsset(data: Prisma.DesignAssetCreateInput) {
  return prisma.designAsset.create({ data });
}

export function getDesignAsset(where: Prisma.DesignAssetWhereUniqueInput) {
  return prisma.designAsset.findUnique({ where });
}

export function listDesignAssets(args?: Omit<Prisma.DesignAssetFindManyArgs, "where"> & { where?: Prisma.DesignAssetWhereInput }) {
  return prisma.designAsset.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateDesignAsset(where: Prisma.DesignAssetWhereUniqueInput, data: Prisma.DesignAssetUpdateInput) {
  return prisma.designAsset.update({ where, data });
}

export function archiveDesignAsset(where: Prisma.DesignAssetWhereUniqueInput) {
  return prisma.designAsset.update({ where, data: { deletedAt: new Date() } });
}

export function createMaterial(data: Prisma.MaterialCreateInput) {
  return prisma.material.create({ data });
}

export function getMaterial(where: Prisma.MaterialWhereUniqueInput) {
  return prisma.material.findUnique({ where });
}

export function listMaterials(args?: Omit<Prisma.MaterialFindManyArgs, "where"> & { where?: Prisma.MaterialWhereInput }) {
  return prisma.material.findMany({ ...args, where: { ...activeRecord, ...args?.where } });
}

export function updateMaterial(where: Prisma.MaterialWhereUniqueInput, data: Prisma.MaterialUpdateInput) {
  return prisma.material.update({ where, data });
}

export function archiveMaterial(where: Prisma.MaterialWhereUniqueInput) {
  return prisma.material.update({ where, data: { deletedAt: new Date() } });
}

export function createApproval(data: Prisma.ApprovalCreateInput) {
  return prisma.approval.create({ data });
}

export function getApproval(where: Prisma.ApprovalWhereUniqueInput) {
  return prisma.approval.findUnique({ where });
}

export function listApprovals(args?: Prisma.ApprovalFindManyArgs) {
  return prisma.approval.findMany(args);
}

export function updateApproval(where: Prisma.ApprovalWhereUniqueInput, data: Prisma.ApprovalUpdateInput) {
  return prisma.approval.update({ where, data });
}

export function deleteApproval(where: Prisma.ApprovalWhereUniqueInput) {
  return prisma.approval.delete({ where });
}

export function createMessage(data: Prisma.MessageCreateInput) {
  return prisma.message.create({ data });
}

export function getMessage(where: Prisma.MessageWhereUniqueInput) {
  return prisma.message.findUnique({ where });
}

export function listMessages(args?: Prisma.MessageFindManyArgs) {
  return prisma.message.findMany(args);
}

export function updateMessage(where: Prisma.MessageWhereUniqueInput, data: Prisma.MessageUpdateInput) {
  return prisma.message.update({ where, data });
}

export function deleteMessage(where: Prisma.MessageWhereUniqueInput) {
  return prisma.message.delete({ where });
}

export function createNotification(data: Prisma.NotificationCreateInput) {
  return prisma.notification.create({ data });
}

export function getNotification(where: Prisma.NotificationWhereUniqueInput) {
  return prisma.notification.findUnique({ where });
}

export function listNotifications(args?: Prisma.NotificationFindManyArgs) {
  return prisma.notification.findMany(args);
}

export function updateNotification(where: Prisma.NotificationWhereUniqueInput, data: Prisma.NotificationUpdateInput) {
  return prisma.notification.update({ where, data });
}

export function deleteNotification(where: Prisma.NotificationWhereUniqueInput) {
  return prisma.notification.delete({ where });
}

export function createCostEstimate(data: Prisma.CostEstimateCreateInput) {
  return prisma.costEstimate.create({ data });
}

export function getCostEstimate(where: Prisma.CostEstimateWhereUniqueInput) {
  return prisma.costEstimate.findUnique({ where });
}

export function listCostEstimates(args?: Prisma.CostEstimateFindManyArgs) {
  return prisma.costEstimate.findMany(args);
}

export function updateCostEstimate(where: Prisma.CostEstimateWhereUniqueInput, data: Prisma.CostEstimateUpdateInput) {
  return prisma.costEstimate.update({ where, data });
}

export function deleteCostEstimate(where: Prisma.CostEstimateWhereUniqueInput) {
  return prisma.costEstimate.delete({ where });
}

export function createPortfolioProject(data: Prisma.PortfolioProjectCreateInput) {
  return prisma.portfolioProject.create({ data });
}

export function getPortfolioProject(where: Prisma.PortfolioProjectWhereUniqueInput) {
  return prisma.portfolioProject.findUnique({ where });
}

export function listPortfolioProjects<T extends Prisma.PortfolioProjectFindManyArgs>(args?: T): Prisma.PrismaPromise<Prisma.PortfolioProjectGetPayload<T>[]> {
  return prisma.portfolioProject.findMany({ ...args, where: { ...activeRecord, ...args?.where } }) as Prisma.PrismaPromise<Prisma.PortfolioProjectGetPayload<T>[]>;
}

export function updatePortfolioProject(where: Prisma.PortfolioProjectWhereUniqueInput, data: Prisma.PortfolioProjectUpdateInput) {
  return prisma.portfolioProject.update({ where, data });
}

export function archivePortfolioProject(where: Prisma.PortfolioProjectWhereUniqueInput) {
  return prisma.portfolioProject.update({ where, data: { deletedAt: new Date() } });
}

export function createActivityEvent(data: Prisma.ActivityEventCreateInput) {
  return prisma.activityEvent.create({ data });
}

export function getActivityEvent(where: Prisma.ActivityEventWhereUniqueInput) {
  return prisma.activityEvent.findUnique({ where });
}

export function listActivityEvents(args?: Prisma.ActivityEventFindManyArgs) {
  return prisma.activityEvent.findMany(args);
}

export function createDocumentVersion(data: Prisma.DocumentVersionCreateInput) {
  return prisma.documentVersion.create({ data });
}

export function listDocumentVersions(args?: Prisma.DocumentVersionFindManyArgs) {
  return prisma.documentVersion.findMany(args);
}

export function createDesignVersion(data: Prisma.DesignVersionCreateInput) {
  return prisma.designVersion.create({ data });
}

export function listDesignVersions(args?: Prisma.DesignVersionFindManyArgs) {
  return prisma.designVersion.findMany(args);
}

export function createProjectMilestone(data: Prisma.ProjectMilestoneCreateInput) {
  return prisma.projectMilestone.create({ data });
}

export function getProjectMilestone(where: Prisma.ProjectMilestoneWhereUniqueInput) {
  return prisma.projectMilestone.findUnique({ where });
}

export function listProjectMilestones(args?: Prisma.ProjectMilestoneFindManyArgs) {
  return prisma.projectMilestone.findMany(args);
}

export function updateProjectMilestone(where: Prisma.ProjectMilestoneWhereUniqueInput, data: Prisma.ProjectMilestoneUpdateInput) {
  return prisma.projectMilestone.update({ where, data });
}

export function deleteProjectMilestone(where: Prisma.ProjectMilestoneWhereUniqueInput) {
  return prisma.projectMilestone.delete({ where });
}

export function createProjectPhase(data: Prisma.ProjectPhaseCreateInput) {
  return prisma.projectPhase.create({ data });
}

export function getProjectPhase(where: Prisma.ProjectPhaseWhereUniqueInput) {
  return prisma.projectPhase.findUnique({ where });
}

export function listProjectPhases(args?: Prisma.ProjectPhaseFindManyArgs) {
  return prisma.projectPhase.findMany(args);
}

export function updateProjectPhase(where: Prisma.ProjectPhaseWhereUniqueInput, data: Prisma.ProjectPhaseUpdateInput) {
  return prisma.projectPhase.update({ where, data });
}

export function deleteProjectPhase(where: Prisma.ProjectPhaseWhereUniqueInput) {
  return prisma.projectPhase.delete({ where });
}

export function createGalleryMedia(data: Prisma.GalleryMediaCreateInput) {
  return prisma.galleryMedia.create({ data });
}

export function listGalleryMedia(args?: Prisma.GalleryMediaFindManyArgs) {
  return prisma.galleryMedia.findMany(args);
}

export function deleteGalleryMedia(where: Prisma.GalleryMediaWhereUniqueInput) {
  return prisma.galleryMedia.delete({ where });
}

