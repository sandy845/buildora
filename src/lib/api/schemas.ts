import { z } from "zod";

// ==============================================================================
// Common Primitives
// ==============================================================================

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(320, "Email must not exceed 320 characters.");

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(256, "Password must not exceed 256 characters.");

export const PhoneSchema = z
  .string()
  .trim()
  .min(5, "Phone number must be at least 5 characters.")
  .max(30, "Phone number must not exceed 30 characters.");

export const IdSchema = z
  .string()
  .trim()
  .min(1, "Identifier is required.")
  .max(128, "Identifier exceeds maximum length.");

// ==============================================================================
// Auth Schemas
// ==============================================================================

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required."),
});

export const RegisterRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
    email: EmailSchema,
    phone: PhoneSchema,
    password: PasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const SessionExchangeRequestSchema = z.object({
  idToken: z.string().min(10, "A valid Firebase ID token is required."),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

export const VerifyOtpRequestSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Verification code must be exactly 6 digits."),
});

export const ForgotPasswordRequestSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().trim().min(10, "A valid reset token is required."),
  password: PasswordSchema,
});

export const ResendVerificationRequestSchema = z.object({
  email: EmailSchema,
});

// ==============================================================================
// Admin Management Schemas
// ==============================================================================

export const AdminCreateProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters.").max(200),
  customerId: IdSchema,
  leadId: IdSchema.optional(),
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
});

export const AdminUpdateProjectSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  targetCompletionDate: z.string().datetime().or(z.date()).optional(),
});

export const AdminConvertLeadSchema = z.object({
  customerId: IdSchema.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
});

export const AdminUpdateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "converted", "closed"]).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const AdminCreateQuotationSchema = z.object({
  projectId: IdSchema,
  quotationNumber: z.string().trim().max(60).optional(),
  subtotal: z.number().positive("Subtotal must be positive."),
  tax: z.number().min(0).default(0),
  total: z.number().positive("Total must be positive."),
  validUntil: z.string().datetime().or(z.date()).optional(),
  notes: z.string().trim().max(5000).optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        total: z.number().positive(),
      })
    )
    .optional(),
});

export const AdminCreatePaymentSchema = z.object({
  projectId: IdSchema,
  quotationId: IdSchema.optional(),
  amount: z.number().positive("Amount must be greater than zero."),
  currency: z.string().trim().length(3, "Currency code must be 3 characters.").default("INR"),
  status: z.enum(["pending", "partially_paid", "paid", "overdue", "failed", "refunded"]).default("pending"),
  method: z.enum(["bank_transfer", "card", "cash", "other"]).optional(),
  reference: z.string().trim().max(120).optional(),
  transactionRef: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

// ==============================================================================
// Client Portal Schemas
// ==============================================================================

export const ClientSendMessageSchema = z.object({
  projectId: IdSchema,
  conversationId: IdSchema.optional(),
  body: z
    .string()
    .trim()
    .min(1, "Message text is required.")
    .max(5000, "Message must not exceed 5000 characters."),
});

export const ClientUpdateApprovalSchema = z.object({
  status: z.enum(["approved", "rejected", "superseded"], {
    error: "Status must be 'approved', 'rejected', or 'superseded'.",
  }),
  comments: z.string().trim().max(2000, "Comments must not exceed 2000 characters.").optional(),
});

export const ClientUpdateQuotationSchema = z.object({
  status: z.enum(["accepted", "rejected", "cancelled"], {
    error: "Status must be 'accepted', 'rejected', or 'cancelled'.",
  }),
});

export const ClientUpdateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120).optional(),
  phone: PhoneSchema.optional(),
  companyName: z.string().trim().max(200).optional(),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).optional(),
});

export const ClientUpdateNotificationSchema = z.object({
  read: z.boolean().default(true),
});

// ==============================================================================
// Storage Schemas
// ==============================================================================

export const StoragePresignRequestSchema = z.object({
  projectId: IdSchema,
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required.")
    .max(255, "File name must not exceed 255 characters.")
    .refine(
      (name) => !name.includes("..") && !name.includes("/") && !name.includes("\\"),
      "File name must not contain path separators or traversal sequences."
    ),
  contentType: z
    .string()
    .trim()
    .min(1, "Content-Type is required.")
    .max(127, "Content-Type must not exceed 127 characters.")
    .regex(/^[a-zA-Z0-9!#$&\-^_.]+\/[a-zA-Z0-9!#$&\-^_.+]+$/, "Content-Type must be a valid MIME type."),
  fileSizeBytes: z.number().int("File size must be an integer.").positive("File size must be greater than zero."),
  category: z.enum(["document", "blueprint"]).default("document"),
});

export const StorageConfirmRequestSchema = z.object({
  projectId: IdSchema,
  key: z
    .string()
    .trim()
    .min(1, "Storage key is required.")
    .max(1024, "Storage key must not exceed 1024 characters.")
    .refine(
      (key) => !key.includes("..") && !key.includes("//"),
      "Storage key must not contain path traversal sequences."
    )
    .refine(
      (key) => key.startsWith("projects/"),
      "Storage key must begin with 'projects/'."
    ),
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required.")
    .max(255, "File name must not exceed 255 characters.")
    .refine(
      (name) => !name.includes("..") && !name.includes("/") && !name.includes("\\"),
      "File name must not contain path separators or traversal sequences."
    ),
  fileUrl: z
    .string()
    .trim()
    .max(2048, "File URL must not exceed 2048 characters.")
    .optional(),
  fileSizeBytes: z
    .number()
    .int("File size must be an integer.")
    .positive("File size must be positive."),
  contentType: z
    .string()
    .trim()
    .min(1, "Content-Type is required.")
    .max(127, "Content-Type must not exceed 127 characters.")
    .regex(/^[a-zA-Z0-9!#$&\-^_.]+\/[a-zA-Z0-9!#$&\-^_.+]+$/, "Content-Type must be a valid MIME type."),
  category: z.enum(["document", "blueprint"]).default("document"),
  documentType: z.string().trim().max(60).default("specification"),
  designAssetType: z.string().trim().max(60).default("drawing"),
  description: z.string().trim().max(1000).optional(),
});
