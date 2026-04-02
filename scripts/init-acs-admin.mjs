/**
 * Run once to create a persistent ACS admin user.
 * Usage: node scripts/init-acs-admin.mjs
 *
 * Copy the output ACS_ADMIN_USER_ID into your .env.local
 */
import { CommunicationIdentityClient } from "@azure/communication-identity"

const connectionString = process.env.ACS_CONNECTION_STRING
if (!connectionString) {
  console.error("Error: ACS_CONNECTION_STRING env var is not set.")
  console.error("Run with: $env:ACS_CONNECTION_STRING='your-string'; node scripts/init-acs-admin.mjs")
  process.exit(1)
}

const client = new CommunicationIdentityClient(connectionString)
const user = await client.createUser()

console.log("\nAdmin user created successfully!\n")
console.log("Add this to your .env.local:\n")
console.log(`ACS_ADMIN_USER_ID=${user.communicationUserId}\n`)
