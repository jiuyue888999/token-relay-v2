import type { Context } from "hono";

/** Extend Hono's context variable map for type safety */
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userApiKey: string;
  }
}

export type AppContext = Context;
