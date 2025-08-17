export const dynamic = "force-dynamic";

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

  if (!svix_id || !svix_timestamp || !svix_signature) return new Response("Missing Svix headers", { status: 400 })

  const body = await req.text()
  const wh = new Webhook(WebhookSecret)

  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent
    if (event.type == 'user.created') {
      try {
        const { id, email_addresses, primary_email_address_id } = event.data
        const primaryEmail = email_addresses.find(
          email => email.id == primary_email_address_id
        )
        if (!primaryEmail) return new Response("No primary email found", { status: 400 })

        const tables = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public'`)
        console.log(tables)

        await prisma.user.create({
          data: {
            clerkId: id,
            email: primaryEmail.email_address
          }
        })
      }
      catch (err) {
        console.error("Error creating new user in database", err)
        return new Response("Error creating new user in database", { status: 400 })
      }
    }
    return new Response("Webhook received", { status: 200 });
  }
  catch (err) {
    console.error("Error verifying webhook", err)
    return new Response("Error verifying webhook", { status: 400 })
  }
}