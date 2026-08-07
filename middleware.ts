import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROTAS_PROTEGIDAS = ["/calcular", "/historico", "/resumo", "/perfil"];

// Duração do trial gratuito, em dias — não existe coluna própria pra isso,
// então é calculado em cima de created_at (evita migração de schema).
const TRIAL_DIAS = 7;

function ehRotaProtegida(pathname: string): boolean {
  return ROTAS_PROTEGIDAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() (não getSession()) porque revalida o JWT contra o servidor do
  // Supabase — getSession() só lê o cookie e pode confiar num token forjado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const temSessao = Boolean(user);

  let temAcessoLiberado = false;
  if (temSessao) {
    // TODO: se o tráfego crescer, considerar cachear esse status (ex: claim
    // no próprio JWT via custom access token hook) pra não bater no banco
    // a cada navegação — por enquanto, simplicidade > performance.
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("plano, is_admin, created_at")
      .eq("id", user!.id)
      .maybeSingle();

    const trialAindaValido =
      usuario?.plano === "trial" &&
      Boolean(usuario.created_at) &&
      Date.now() - new Date(usuario.created_at as string).getTime() < TRIAL_DIAS * 24 * 60 * 60 * 1000;

    // is_admin libera acesso independente do plano — pra testar o app sem
    // depender de assinatura real/cancelamento na Cakto.
    temAcessoLiberado = usuario?.is_admin === true || usuario?.plano === "ativo" || trialAindaValido;
  }

  if (ehRotaProtegida(pathname)) {
    if (!temSessao) return NextResponse.redirect(new URL("/login", request.url));
    if (!temAcessoLiberado) return NextResponse.redirect(new URL("/assinatura", request.url));
    return response;
  }

  if (pathname === "/login" && temSessao) {
    return NextResponse.redirect(new URL(temAcessoLiberado ? "/calcular" : "/assinatura", request.url));
  }

  if (pathname === "/assinatura") {
    if (!temSessao) return NextResponse.redirect(new URL("/login", request.url));
    if (temAcessoLiberado) return NextResponse.redirect(new URL("/calcular", request.url));
  }

  if (pathname === "/" && temSessao && temAcessoLiberado) {
    return NextResponse.redirect(new URL("/calcular", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|images|icones|favicon.ico).*)"],
};
