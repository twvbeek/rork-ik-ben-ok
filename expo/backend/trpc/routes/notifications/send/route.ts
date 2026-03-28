import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure
  .input(
    z.object({
      userId: z.string(),
      deviceTokens: z.array(z.string()),
      title: z.string(),
      body: z.string(),
      data: z.record(z.string(), z.any()).optional(),
    })
  )
  .mutation(({ ctx, input }) => {
    console.log(`[Push Notification] Sending to ${input.deviceTokens.length} devices`);
    console.log(`[Push Notification] Title: ${input.title}`);
    console.log(`[Push Notification] Body: ${input.body}`);

    return {
      success: true,
      sentCount: input.deviceTokens.length,
    };
  });
