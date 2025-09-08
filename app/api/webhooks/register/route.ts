import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const WebhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!WebhookSecret) throw new Error('Please add CLERK_WEBHOOK_SIGNING_SECRET in env')

  const headerPayload = headers()
  const svix_id = (await headerPayload).get("svix-id")
  const svix_timestamp = (await headerPayload).get("svix-timestamp")
  const svix_signature = (await headerPayload).get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WebhookSecret)

  let event: WebhookEvent
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent
  } catch (err) {
    console.error("❌ Error verifying webhook:", err)
    return new Response("Error verifying webhook", { status: 400 })
  }

  if (event.type === 'user.created') {
    try {
      const { id, email_addresses, primary_email_address_id } = event.data

      // Try to pick primary, else fallback to first email
      const primaryEmail =
        email_addresses.find(e => e.id === primary_email_address_id) ??
        email_addresses[0]

      if (!primaryEmail) {
        console.error("❌ No email found in Clerk event:", JSON.stringify(event.data, null, 2))
        return new Response("No email found", { status: 400 })
      }

      console.log("✅ Creating user with email:", primaryEmail.email_address)

      await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail.email_address
        }
      })
    } catch (err: any) {
      console.error("❌ DB ERROR:", JSON.stringify(err, null, 2))
      return new Response("Error creating new user in database", { status: 400 })
    }
  }

  return new Response("Webhook received", { status: 200 })
}
