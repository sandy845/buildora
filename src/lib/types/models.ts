/**
 * Core Domain Model Types for Buildora
 * Compatible with Firebase Firestore documents and application services.
 */

export type UserRole = "customer" | "admin";
export type AccountStatus = "active" | "suspended" | "deactivated";

export type User = {
  id: string;
  name: string;
  email: string;
  normalizedEmail: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerifiedAt?: Date | string | null;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  city?: string;
  projectBrief?: string;
  budgetRange?: string;
  source?: string;
  status: LeadStatus;
  customerId?: string | null;
  serviceId?: string | null;
  assignedToId?: string | null;
  convertedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";

export type ProjectMilestone = {
  id: string;
  projectId: string;
  name: string;
  dueDate?: Date | string | null;
  status?: string;
  description?: string;
  sortOrder?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type ProjectPhase = {
  id: string;
  projectId: string;
  name: string;
  status: string;
  progress: number;
  sortOrder: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  customerId: string;
  originatingLeadId?: string | null;
  location?: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  budget?: number;
  spent?: number;
  startDate?: Date | string | null;
  targetCompletionDate?: Date | string | null;
  phases?: ProjectPhase[];
  milestones?: ProjectMilestone[];
  customer?: { name?: string; email?: string };
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  turnaroundDays?: number;
  active?: boolean;
  highlights?: string[];
  include?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";

export type QuotationLineItem = {
  id?: string;
  quotationId?: string;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Quotation = {
  id: string;
  quotationNumber: string;
  projectId: string;
  status: QuotationStatus;
  subtotal: number;
  tax: number;
  total: number;
  validUntil?: Date | string | null;
  notes?: string;
  lineItems?: QuotationLineItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type PaymentStatus = "pending" | "partially_paid" | "paid" | "overdue" | "failed" | "refunded";
export type PaymentMethod = "bank_transfer" | "card" | "cash" | "upi" | "other";

export type Payment = {
  id: string;
  projectId: string;
  amount: number;
  status: PaymentStatus;
  dueDate?: Date | string | null;
  paidAt?: Date | string | null;
  method?: PaymentMethod;
  transactionReference?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export const DocumentType = {
  contract: "contract",
  quotation: "quotation",
  invoice: "invoice",
  receipt: "receipt",
  plan: "plan",
  specification: "specification",
  other: "other",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export type Document = {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType | string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export const DesignAssetType = {
  image: "image",
  drawing: "drawing",
  rendering: "rendering",
  floor_plan: "floor_plan",
  moodboard: "moodboard",
  other: "other",
} as const;
export type DesignAssetType = (typeof DesignAssetType)[keyof typeof DesignAssetType];

export type DesignAsset = {
  id: string;
  projectId: string;
  name: string;
  type: DesignAssetType | string;
  fileUrl: string;
  version?: number;
  uploadedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "superseded";
export type ApprovalTargetType = "design" | "document" | "material" | "quotation" | "milestone";

export type Approval = {
  id: string;
  projectId: string;
  targetType: ApprovalTargetType | string;
  targetId?: string;
  status: ApprovalStatus;
  feedback?: string;
  decidedBy?: string;
  decidedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type Material = {
  id: string;
  name: string;
  category?: string;
  supplier?: string;
  unit?: string;
  unitPrice?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type ActivityEvent = {
  id: string;
  projectId?: string;
  actorId?: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
};

export type Notification = {
  id: string;
  userId: string;
  projectId?: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt?: Date | string | null;
  createdAt: Date | string;
};

export type Message = {
  id: string;
  conversationId?: string;
  senderId?: string;
  body: string;
  sentAt: Date | string;
  deletedAt?: Date | string | null;
};

export type Conversation = {
  id: string;
  projectId?: string;
  customerId?: string;
  subject?: string;
  status?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type CostEstimate = {
  id: string;
  projectId?: string;
  totalEstimate: number;
  breakdown?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type GalleryMedia = {
  id: string;
  portfolioProjectId: string;
  url: string;
  caption?: string | null;
  sortOrder?: number;
};

export type PortfolioProject = {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  description?: string | null;
  scope?: string[];
  details?: Record<string, string>;
  gallery?: GalleryMedia[];
  featured?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};
