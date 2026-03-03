declare module "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (
    handler: (req: Request) => Response | Promise<Response>,
  ) => void;
};
