// lib/mongodb.ts
import { MongoClient, type Db, type Document, type Collection } from "mongodb"
import { ObjectId } from "mongodb"
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  throw new Error('Invalid/Missing env var: MONGODB_URI')
}

// Allow overriding DB name via env; default to your current choice
const DB_NAME = process.env.MONGODB_DB ?? "survey_app"

// You can add client options if needed (SRV, retryWrites, etc.)
// Keep it typed (empty object is fine too)
const options: Readonly<Record<string, never>> = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // Reuse the connection across HMR reloads in dev
  const g = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> }
  if (!g._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options)
    g._mongoClientPromise = client.connect()
  }
  clientPromise = g._mongoClientPromise
} else {
  client = new MongoClient(MONGODB_URI, options)
  clientPromise = client.connect()
}

// Default export for modules that just need the client promise
export default clientPromise

/** Get the connected database instance. */
export async function getDatabase(): Promise<Db> {
  const c = await clientPromise
  return c.db(DB_NAME)
}

/** Strongly-typed collection getter. */
export async function getCollection<TSchema extends Document>(
  name: string
): Promise<Collection<TSchema>> {
  const db = await getDatabase()
  return db.collection<TSchema>(name)
}

/** Convenience: connect and get db (rarely needed if you use helpers above). */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const c = await clientPromise
  return { client: c, db: c.db(DB_NAME) }
}

/* ------------------------------------------------------------------ */
/* Typed helpers for your auth logic (optional but convenient)        */
/* ------------------------------------------------------------------ */

// Share these types so your auth files don’t need to re-declare them.
export type UserDoc = { _id: ObjectId; tokenVersion?: number }
export type AdminDoc = { userId: string; admin: boolean }

/** Get the users collection with the correct shape. */
export async function getUsersCollection() {
  return getCollection<UserDoc>("users")
}

/** Get the admins collection with the correct shape. */
export async function getAdminsCollection() {
  return getCollection<AdminDoc>("admins")
}

/** Optional: call once on boot or in a migration to ensure useful indexes. */
export async function ensureAuthIndexes(): Promise<void> {
  const admins = await getAdminsCollection()
  await admins.createIndex({ userId: 1 }, { unique: true })
  const users = await getUsersCollection()
  await users.createIndex({ _id: 1 }, { unique: true })
}
