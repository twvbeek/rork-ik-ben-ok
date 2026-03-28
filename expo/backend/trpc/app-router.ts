import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import generateInvite from "./routes/invite/generate/route";
import acceptInvite from "./routes/invite/accept/route";
import validateInvite from "./routes/invite/validate/route";
import sendNotification from "./routes/notifications/send/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  invite: createTRPCRouter({
    generate: generateInvite,
    accept: acceptInvite,
    validate: validateInvite,
  }),
  notifications: createTRPCRouter({
    send: sendNotification,
  }),
});

export type AppRouter = typeof appRouter;
