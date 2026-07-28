// Mock de sessão/assinatura enquanto Supabase Auth e o pagamento real não
// estão conectados. Esses cookies só marcam "passou pela etapa" — não
// carregam nenhuma sessão de verdade, só servem pra middleware.ts liberar
// ou não as rotas protegidas durante o desenvolvimento.
//
// TODO: quando o Supabase Auth estiver conectado, trocar MOCK_SESSION_COOKIE
// pela sessão real (supabase.auth.getUser() / cookie de sessão do Supabase).
// TODO: quando o pagamento real estiver conectado, trocar MOCK_PLANO_COOKIE
// pela consulta real de assinatura/trial no banco (ou webhook do gateway).

export const MOCK_SESSION_COOKIE = "bv_mock_session";
export const MOCK_PLANO_COOKIE = "bv_mock_plano";

const UM_MES_EM_SEGUNDOS = 60 * 60 * 24 * 30;

export function marcarSessaoMock() {
  document.cookie = `${MOCK_SESSION_COOKIE}=1; path=/; max-age=${UM_MES_EM_SEGUNDOS}`;
}

export function marcarPlanoMock(plano: "trial" | "ativo") {
  document.cookie = `${MOCK_PLANO_COOKIE}=${plano}; path=/; max-age=${UM_MES_EM_SEGUNDOS}`;
}

export function limparSessaoMock() {
  document.cookie = `${MOCK_SESSION_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${MOCK_PLANO_COOKIE}=; path=/; max-age=0`;
}
