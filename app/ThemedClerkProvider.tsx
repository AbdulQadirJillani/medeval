import { ClerkProvider } from "@clerk/nextjs";

export default function ThemedClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      appearance={{
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton'
        },
        elements: {
          cardBox: '!shadow-[0px_0px_50px_10px_rgb(0_0_0_/_0.1)] !shadow-accent',
          card: '!bg-background !transition-none',
          footer: '!hidden',
          headerTitle: '!text-foreground !transition-none',
          headerSubtitle: '!text-muted-foreground',
          formFieldLabel: '!text-foreground !transition-none',
          formFieldInput: '!bg-accent !text-foreground !transition-none !placeholder-muted-foreground',
          formButtonPrimary: '!bg-linear-to-r from-[#5A67D8] to-[#805AD5]',
          socialButtonsBlockButton: '!text-foreground !border !border-secondary !transition-none',
          userButtonTrigger: '!text-foreground',
          userButtonPopoverMain: '!bg-secondary !text-foreground',
          userButtonPopoverActionButton: '!bg-secondary !text-foreground !hover:text-black',
          userButtonPopoverFooter: '!hidden',
          userButtonPopoverCard: { pointerEvents: "initial" }
        }
      }}>
      {children}
    </ClerkProvider>
  )
}
