import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente pra Server Components / Route Handlers. Fora de um Route Handler
// ou Server Action, o Next não deixa escrever cookies — o catch abaixo
// ignora isso de propósito, já que o middleware é quem renova a sessão.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // chamado de um Server Component — ok ignorar.
        }
      },
    },
  });
}
