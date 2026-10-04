import { getAdminDb } from "./admin";
import type { Query, WhereFilterOp } from "firebase-admin/firestore";
import { scryptSync } from "node:crypto";

export type FirestoreDocument = {
  id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  [key: string]: unknown;
};

export type QueryFilter = {
  field: string;
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "array-contains-any";
  value: unknown;
};

export type QueryOptions = {
  where?: QueryFilter[];
  orderBy?: { field: string; direction?: "asc" | "desc" };
  limit?: number;
  includeDeleted?: boolean;
};

// In-memory fallback cache for local dev / tests when Firestore credentials are not yet configured
const inMemoryStore = new Map<string, Map<string, FirestoreDocument>>();

const e2eTestUsers: FirestoreDocument[] = process.env.E2E_TEST === "1"
  ? [
      {
        id: "test-customer-e2e-id",
        name: "Aarav Customer",
        email: "test_customer@buildora.in",
        normalizedEmail: "test_customer@buildora.in",
        phone: "+91 98765 43210",
        passwordHash: `scrypt:buildora_e2e_customer:${scryptSync("Password123!", "buildora_e2e_customer", 64).toString("hex")}`,
        role: "customer",
        accountStatus: "active",
        emailVerifiedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        deletedAt: null,
      },
      {
        id: "test-admin-e2e-id",
        name: "Buildora Administrator",
        email: "test_admin@buildora.in",
        normalizedEmail: "test_admin@buildora.in",
        phone: "+91 99999 00000",
        passwordHash: `scrypt:buildora_e2e_admin:${scryptSync("Password123!", "buildora_e2e_admin", 64).toString("hex")}`,
        role: "admin",
        accountStatus: "active",
        emailVerifiedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        deletedAt: null,
      },
    ]
  : [];

const devDefaultUsers: FirestoreDocument[] = [
  {
    id: "admin-default-id",
    name: "Buildora Admin",
    email: "admin@buildora.in",
    normalizedEmail: "admin@buildora.in",
    phone: "+91 99999 00000",
    role: "admin",
    accountStatus: "active",
    passwordHash: "scrypt:buildora_dev_admin:1485d7a43f003608e3929cdcd6846f1b603dfdc0135a6411b765dd50c9c13e5efe3dde7ff402f466cfb0f75d870f0e88e23fa82ca864278542cb003a56391360",
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "client-default-id",
    name: "Buildora Client",
    email: "client@buildora.in",
    normalizedEmail: "client@buildora.in",
    phone: "+91 98765 43210",
    role: "customer",
    accountStatus: "active",
    passwordHash: "scrypt:buildora_dev_client:47994820dfd9c7e55fdc3576dcef9939ddac897993775423c5470280bbdc075d917fe98dff7558604bb0dfe08553b47f3d8f388ad598f6074c976b79b215c2ff",
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  },
  ...e2eTestUsers,
];

function getDatabase() {
  return process.env.E2E_TEST === "1" ? null : getAdminDb();
}

function getMemoryCollection(collectionName: string): Map<string, FirestoreDocument> {
  let col = inMemoryStore.get(collectionName);
  if (!col) {
    col = new Map<string, FirestoreDocument>();
    inMemoryStore.set(collectionName, col);
    if (collectionName === "users") {
      for (const u of devDefaultUsers) {
        col.set(u.id, { ...u });
      }
    }
    if (collectionName === "projects" && process.env.E2E_TEST === "1") {
      col.set("11111111-1111-1111-1111-111111111111", {
        id: "11111111-1111-1111-1111-111111111111",
        customerId: "test-customer-e2e-id",
        name: "Residence 01",
        slug: "residence-01-test",
        location: "Worli, Mumbai",
        status: "in_progress",
        progress: 68,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        deletedAt: null,
      });
    }
  }
  return col;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function firestoreCreate<T extends Record<string, unknown>>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<FirestoreDocument & T> {
  const db = getDatabase();
  const id = customId || (data.id as string) || generateId();
  const now = new Date().toISOString();

  const record: FirestoreDocument & T = {
    ...data,
    id,
    createdAt: (data.createdAt as string) || now,
    updatedAt: now,
    deletedAt: null,
  };

  if (!db) {
    getMemoryCollection(collectionName).set(id, record);
    return record;
  }

  try {
    await db.collection(collectionName).doc(id).set(record);
    return record;
  } catch (error) {
    console.warn(`[firestore] Falling back to memory for ${collectionName}.create:`, error);
    getMemoryCollection(collectionName).set(id, record);
    return record;
  }
}

export async function firestoreGet<T extends FirestoreDocument = FirestoreDocument>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const db = getDatabase();
  if (!db) {
    const item = getMemoryCollection(collectionName).get(id);
    return (item as T) || null;
  }

  try {
    const docSnap = await db.collection(collectionName).doc(id).get();
    if (!docSnap.exists) {
      // Check memory fallback
      const memItem = getMemoryCollection(collectionName).get(id);
      return (memItem as T) || null;
    }
    const data = docSnap.data() as T;
    return { ...data, id: docSnap.id };
  } catch (error) {
    console.warn(`[firestore] Falling back to memory for ${collectionName}.get:`, error);
    const item = getMemoryCollection(collectionName).get(id);
    return (item as T) || null;
  }
}

export async function firestoreFind<T extends FirestoreDocument = FirestoreDocument>(
  collectionName: string,
  options?: QueryOptions
): Promise<T[]> {
  const db = getDatabase();

  if (!db) {
    return filterInMemory<T>(collectionName, options);
  }

  try {
    let q: Query = db.collection(collectionName);

    if (options?.where) {
      for (const filter of options.where) {
        if (filter.value !== undefined) {
          q = q.where(filter.field, filter.operator as WhereFilterOp, filter.value);
        }
      }
    }

    if (!options?.includeDeleted) {
      q = q.where("deletedAt", "==", null);
    }

    if (options?.orderBy) {
      q = q.orderBy(options.orderBy.field, options.orderBy.direction || "asc");
    }

    if (options?.limit) {
      q = q.limit(options.limit);
    }

    const snapshot = await q.get();
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as T));
  } catch (error) {
    console.warn(`[firestore] Query failed on ${collectionName}, using memory fallback:`, error);
    return filterInMemory<T>(collectionName, options);
  }
}

export async function firestoreFindOne<T extends FirestoreDocument = FirestoreDocument>(
  collectionName: string,
  options?: QueryOptions
): Promise<T | null> {
  const items = await firestoreFind<T>(collectionName, { ...options, limit: 1 });
  return items[0] || null;
}

export async function firestoreUpdate<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<FirestoreDocument> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const updatePayload = { ...data, updatedAt: now };

  if (!db) {
    const existing = getMemoryCollection(collectionName).get(id) || { id };
    const updated = { ...existing, ...updatePayload };
    getMemoryCollection(collectionName).set(id, updated);
    return updated;
  }

  try {
    await db.collection(collectionName).doc(id).set(updatePayload, { merge: true });
    const snap = await db.collection(collectionName).doc(id).get();
    return { ...snap.data(), id: snap.id } as FirestoreDocument;
  } catch (error) {
    console.warn(`[firestore] Falling back to memory for ${collectionName}.update:`, error);
    const existing = getMemoryCollection(collectionName).get(id) || { id };
    const updated = { ...existing, ...updatePayload };
    getMemoryCollection(collectionName).set(id, updated);
    return updated;
  }
}

export async function firestoreSoftDelete(
  collectionName: string,
  id: string
): Promise<FirestoreDocument> {
  return firestoreUpdate(collectionName, id, { deletedAt: new Date().toISOString() });
}

export async function firestoreHardDelete(
  collectionName: string,
  id: string
): Promise<boolean> {
  const db = getDatabase();
  getMemoryCollection(collectionName).delete(id);

  if (db) {
    try {
      await db.collection(collectionName).doc(id).delete();
      return true;
    } catch (err) {
      console.warn(`[firestore] Failed to delete document ${id} from ${collectionName}:`, err);
    }
  }
  return true;
}

export async function firestoreCount(
  collectionName: string,
  options?: QueryOptions
): Promise<number> {
  const items = await firestoreFind(collectionName, options);
  return items.length;
}

function filterInMemory<T extends FirestoreDocument>(
  collectionName: string,
  options?: QueryOptions
): T[] {
  const col = getMemoryCollection(collectionName);
  let results = Array.from(col.values()) as T[];

  if (!options?.includeDeleted) {
    results = results.filter((item) => item.deletedAt === null || item.deletedAt === undefined);
  }

  if (options?.where) {
    for (const filter of options.where) {
      results = results.filter((item) => {
        const val = item[filter.field];
        if (filter.operator === "==") return val === filter.value;
        if (filter.operator === "!=") return val !== filter.value;
        if (filter.operator === "in") return Array.isArray(filter.value) && filter.value.includes(val);
        return true;
      });
    }
  }

  if (options?.orderBy) {
    const { field, direction = "asc" } = options.orderBy;
    results.sort((a, b) => {
      const aVal = String(a[field] ?? "");
      const bVal = String(b[field] ?? "");
      return direction === "desc" ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });
  }

  if (options?.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  return results;
}
