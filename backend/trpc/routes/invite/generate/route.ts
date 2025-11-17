import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(
    z.object({
      userId: z.string(),
      contactId: z.string(),
      contactName: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
  )
  .mutation(({ input }) => {
    const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || "https://rork.app";
    const inviteLink = `${baseUrl}/invite/${inviteToken}`;

    return {
      inviteToken,
      inviteLink,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
