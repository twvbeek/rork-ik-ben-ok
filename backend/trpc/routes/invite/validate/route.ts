import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(
    z.object({
      inviteToken: z.string(),
    })
  )
  .query(({ input }) => {
    return {
      valid: true,
      inviterName: "Check-in User",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
