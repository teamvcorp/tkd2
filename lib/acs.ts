import { CommunicationIdentityClient } from "@azure/communication-identity"
import { ChatClient } from "@azure/communication-chat"
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from "@azure/communication-common"

const connectionString = process.env.ACS_CONNECTION_STRING!

function getEndpoint(): string {
  const match = connectionString.match(/endpoint=(https:\/\/[^;]+)/)
  if (!match) throw new Error("Invalid ACS_CONNECTION_STRING: no endpoint found")
  return match[1].replace(/\/$/, "")
}

export const ACS_ENDPOINT = getEndpoint()

export function getIdentityClient() {
  return new CommunicationIdentityClient(connectionString)
}

export async function getAdminChatClient() {
  const adminUserId = process.env.ACS_ADMIN_USER_ID
  if (!adminUserId) {
    throw new Error("ACS_ADMIN_USER_ID is not set. Run the init-acs-admin script first.")
  }

  const identityClient = getIdentityClient()
  const adminUser: CommunicationUserIdentifier = { communicationUserId: adminUserId }
  const { token } = await identityClient.getToken(adminUser, ["chat"])
  const credential = new AzureCommunicationTokenCredential(token)
  const chatClient = new ChatClient(ACS_ENDPOINT, credential)
  return { chatClient, user: adminUser, token }
}
