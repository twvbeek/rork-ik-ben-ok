import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(
    z.object({
      inviteToken: z.string(),
      userId: z.string(),
      deviceToken: z.string().optional(),
    })
  )
  .mutation(({ input }) => {
    return {
      success: true,
      message: "Invite accepted successfully",
      userId: input.userId,
      deviceToken: input.deviceToken,
    };
  });
