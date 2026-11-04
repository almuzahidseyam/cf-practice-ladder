import { initTRPC } from "@trpc/server";
import type { Context } from "./context";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {...shape,message:error.code==='BAD_REQUEST' ? 'Enter valid Codeforces handles using letters, numbers, dots, underscores or hyphens (up to 24 characters).' : shape.message};
  },
});

export const router = t.router;

export const publicProcedure = t.procedure;
