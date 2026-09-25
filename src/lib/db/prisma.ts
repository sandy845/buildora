/**
 * Firebase Firestore Compatibility Adapter
 * Proxies Prisma-style model queries directly to Firebase Cloud Firestore.
 */

import {
  firestoreCreate,
  firestoreGet,
  firestoreFind,
  firestoreFindOne,
  firestoreUpdate,
  firestoreHardDelete,
  firestoreCount,
  type QueryFilter,
  type QueryOptions,
} from "@/lib/firebase/firestore";

// Map Prisma model names (camelCase) to Firestore collection names (plural)
const collectionMap: Record<string, string> = {
  user: "users",
  lead: "leads",
  project: "projects",
  service: "services",
  projectService: "projectServices",
  quotation: "quotations",
  quotationLineItem: "quotationLineItems",
  payment: "payments",
  document: "documents",
  documentVersion: "documentVersions",
  designAsset: "designAssets",
  designVersion: "designVersions",
  material: "materials",
  approval: "approvals",
  message: "messages",
  conversation: "conversations",
  notification: "notifications",
  costEstimate: "costEstimates",
  portfolioProject: "portfolioProjects",
  activityEvent: "activityEvents",
  auditLog: "auditLogs",
  projectMilestone: "projectMilestones",
  projectPhase: "projectPhases",
  galleryMedia: "galleryMedia",
  emailVerificationToken: "emailVerificationTokens",
  passwordResetToken: "passwordResetTokens",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWhere(whereObj?: any): QueryOptions {
  if (!whereObj) return {};
  const options: QueryOptions = {};
  const filters: QueryFilter[] = [];

  for (const [key, val] of Object.entries(whereObj)) {
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

  if (filters.length > 0) options.where = filters;
  return options;
}

function createModelHandler(modelName: string) {
  const collection = collectionMap[modelName] || `${modelName}s`;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique: async (args: any) => {
      if (args?.where?.id) {
        return firestoreGet(collection, args.where.id);
      }
      return firestoreFindOne(collection, parseWhere(args?.where));
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findFirst: async (args: any) => {
      const opts = parseWhere(args?.where);
      if (args?.orderBy) {
        const orderObj = Array.isArray(args.orderBy) ? args.orderBy[0] : args.orderBy;
        if (orderObj) {
          const [field, dir] = Object.entries(orderObj)[0] || [];
          if (field) opts.orderBy = { field, direction: String(dir).toLowerCase() === "desc" ? "desc" : "asc" };
        }
      }
      return firestoreFindOne(collection, opts);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: async (args: any) => {
      const opts = parseWhere(args?.where);
      if (args?.orderBy) {
        const orderObj = Array.isArray(args.orderBy) ? args.orderBy[0] : args.orderBy;
        if (orderObj) {
          const [field, dir] = Object.entries(orderObj)[0] || [];
          if (field) opts.orderBy = { field, direction: String(dir).toLowerCase() === "desc" ? "desc" : "asc" };
        }
      }
      if (args?.take) opts.limit = args.take;
      return firestoreFind(collection, opts);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (args: any) => {
      return firestoreCreate(collection, args.data, args.data?.id);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (args: any) => {
      const id = args?.where?.id || (await firestoreFindOne<{ id: string }>(collection, parseWhere(args?.where)))?.id;
      if (!id) throw new Error(`Document not found for update in ${collection}`);
      return firestoreUpdate(collection, id, args.data);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateMany: async (args: any) => {
      const items = await firestoreFind(collection, parseWhere(args?.where));
      for (const item of items) {
        await firestoreUpdate(collection, item.id, args.data);
      }
      return { count: items.length };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: async (args: any) => {
      const id = args?.where?.id || (await firestoreFindOne<{ id: string }>(collection, parseWhere(args?.where)))?.id;
      if (id) await firestoreHardDelete(collection, id);
      return { id };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteMany: async (args: any) => {
      const items = await firestoreFind(collection, parseWhere(args?.where));
      for (const item of items) {
        await firestoreHardDelete(collection, item.id);
      }
      return { count: items.length };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count: async (args: any) => {
      return firestoreCount(collection, parseWhere(args?.where));
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aggregate: async (args: any) => {
      const items = await firestoreFind(collection, parseWhere(args?.where));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: { _sum: Record<string, number> } = { _sum: {} };
      if (args?._sum) {
        for (const field of Object.keys(args._sum)) {
          const sum = items.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
          result._sum[field] = sum;
        }
      }
      return result;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    groupBy: async (args: any) => {
      const items = await firestoreFind(collection, parseWhere(args?.where));
      const groupKey = args?.by?.[0] || "status";
      const counts: Record<string, number> = {};
      for (const item of items) {
        const val = String(item[groupKey] || "unknown");
        counts[val] = (counts[val] || 0) + 1;
      }
      return Object.entries(counts).map(([status, count]) => ({
        [groupKey]: status,
        _count: { _all: count },
      }));
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert: async (args: any) => {
      const existing = await firestoreFindOne(collection, parseWhere(args?.where));
      if (existing) {
        return firestoreUpdate(collection, existing.id, args.update);
      }
      return firestoreCreate(collection, args.create, args.create?.id);
    },
  };
}

// Proxy object to dynamically create model handlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === "$transaction") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (cbOrList: any) => {
          if (typeof cbOrList === "function") {
            return cbOrList(prisma);
          }
          if (Array.isArray(cbOrList)) {
            return Promise.all(cbOrList);
          }
          return cbOrList;
        };
      }
      if (prop === "$queryRawUnsafe") {
        return async () => [{ result: 1 }];
      }
      return createModelHandler(prop);
    },
  }
);
