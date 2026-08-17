import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminUser } from "@/lib/supabase/admin";
import AdminQueue from "@/components/AdminQueue";
import AdminCompaniesList from "@/components/AdminCompaniesList";
import AdminTicketInbox from "@/components/AdminTicketInbox";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" });

async function getUmamiStats() {
  const url = process.env.NEXT_PUBLIC_UMAMI_URL;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const user = process.env.UMAMI_API_USER ?? "admin";
  const pass = process.env.UMAMI_API_PASS;
  if (!url || !websiteId || !pass) return null;
  try {
    const authRes = await fetch(`${url}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
      cache: "no-store",
    });
    if (!authRes.ok) return null;
    const { token } = await authRes.json();
    const now = Date.now();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startAt = startOfDay.getTime();
    const h = { Authorization: `Bearer ${token}` };
    const [statsRes, pagesRes, referrersRes] = await Promise.all([
      fetch(`${url}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${now}`, { headers: h, cache: "no-store" }),
      fetch(`${url}/api/websites/${websiteId}/metrics?startAt=${startAt}&endAt=${now}&type=path&limit=8`, { headers: h, cache: "no-store" }),
      fetch(`${url}/api/websites/${websiteId}/metrics?startAt=${startAt}&endAt=${now}&type=referrer&limit=5`, { headers: h, cache: "no-store" }),
    ]);
    const stats = statsRes.ok ? await statsRes.json() : null;
    const pages = pagesRes.ok ? await pagesRes.json() : [];
    const referrers = referrersRes.ok ? await referrersRes.json() : [];
    return { stats, pages: Array.isArray(pages) ? pages : [], referrers: Array.isArray(referrers) ? referrers : [], umamiUrl: url };
  } catch { return null; }
}

function formatDate(value?: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Sin actividad";
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <h1 className="text-3xl font-semibold text-brand-dark">Panel de administración</h1>
        <p className="mt-4 text-slate-600">Inicia sesión con una cuenta autorizada para continuar.</p>
        <Link href="/ingresar?next=/admin" className="mt-7 inline-flex rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white">Ingresar</Link>
      </div>
    );
  }

  if (!isAdminUser(user)) {
    return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Área privada</h1><p className="mt-4 text-slate-600">Esta sección está reservada para el equipo de TodoPlástico.</p></div>;
  }

  const admin = createAdminClient();
  if (!admin) {
    return <div className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-semibold text-brand-dark">Configuración pendiente</h1><p className="mt-4 text-slate-600">Añade `SUPABASE_SERVICE_ROLE_KEY` y `TODO_PLASTICO_ADMIN_EMAILS` al entorno local para activar el panel operativo.</p></div>;
  }

  let queue: Array<{ id: number; title: string; slug: string; description: string; category: string; location: string | null; status: string; rejection_reason: string | null; created_at: string; company?: { name?: string } | null; photos?: { storage_path: string }[] }> = [];
  let publishedCount = 0;
  let rejectedCount = 0;
  let reviewedCount = 0;
  let queryErrors: string[] = [];
  let usersError = false;
  let users: Array<{ id: string; email?: string; created_at: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null; user_metadata?: { company_name?: string } }> = [];
  let companies: Array<{ id: string; name: string; slug: string; location: string | null; plan: string; is_verified: boolean; status: string; created_at: string }> = [];
  type AdminTicket = { id: number; ticket_code: string; company_id: string; category: string; subject: string; status: string; priority: string; created_at: string; updated_at: string; resolved_at: string | null; company?: { name: string; ref_code: string } | null };
  let tickets: AdminTicket[] = [];

  const [umamiData, queueResult, publishedResult, rejectedResult, reviewedResult, usersResult, companiesResult, ticketsResult] = await Promise.all([
    getUmamiStats(),
    admin.from("mkt_listings").select("id, title, slug, description, category, location, status, rejection_reason, created_at, company:mkt_companies(name, slug), photos:mkt_listing_photos(*)").eq("status", "pending_review").order("created_at", { ascending: true }).limit(50),
    admin.from("mkt_listings").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("mkt_listings").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    admin.from("mkt_moderation_events").select("id", { count: "exact", head: true }),
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("mkt_companies").select("id, name, slug, location, plan, is_verified, status, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("mkt_tickets").select("id, ticket_code, company_id, category, subject, status, priority, created_at, updated_at, resolved_at, company:mkt_companies(name, ref_code)").order("updated_at", { ascending: false }).limit(100),
  ]);
  queue = (queueResult.data ?? []).map((item) => ({ ...item, company: Array.isArray(item.company) ? item.company[0] : item.company })) as typeof queue;
  if (queueResult.error) queryErrors.push("cola de revisión");
  publishedCount = publishedResult.count ?? 0;
  if (publishedResult.error) queryErrors.push("publicados");
  rejectedCount = rejectedResult.count ?? 0;
  if (rejectedResult.error) queryErrors.push("rechazados");
  reviewedCount = reviewedResult.count ?? 0;
  if (reviewedResult.error) queryErrors.push("eventos IA");
  users = (usersResult.data?.users ?? []) as typeof users;
  usersError = Boolean(usersResult.error);
  companies = (companiesResult.data ?? []) as typeof companies;
  if (companiesResult.error) queryErrors.push("empresas");
  tickets = ((ticketsResult.data ?? []).map(t => ({ ...t, company: Array.isArray(t.company) ? t.company[0] : t.company }))) as AdminTicket[];
  if (ticketsResult.error) queryErrors.push("tickets");

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sky">TodoPlástico · Operación</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-brand-dark sm:text-5xl">Panel de control.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Usuarios, registros de empresas y revisión de anuncios en un mismo espacio operativo.</p>
        </div>
        <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2 text-sm font-semibold">
          <Link href="/admin/nuevo-anuncio" className="rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark">Nuevo anuncio</Link>
          <a href="#usuarios" className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 hover:border-brand hover:text-brand">Usuarios</a>
          <a href="#empresas" className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 hover:border-brand hover:text-brand">Registros</a>
          <a href="#anuncios" className="rounded-full bg-brand-dark px-4 py-2 text-white hover:bg-brand">Revisar anuncios</a>
          <a href="#analitica" className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 hover:border-brand hover:text-brand">Analítica</a>
          <a href="#tickets" className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 hover:border-brand hover:text-brand">
            Tickets {tickets.filter(t => t.status === "open").length > 0 && <span className="ml-1 rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] text-white">{tickets.filter(t => t.status === "open").length}</span>}
          </a>
        </nav>
      </div>

      {queryErrors.length > 0 && <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Error al cargar: {queryErrors.join(", ")}. Los datos mostrados pueden estar incompletos.</p>}
      <section className="mt-10 grid grid-cols-2 gap-x-5 gap-y-7 border-y border-slate-200 py-6 sm:grid-cols-3 lg:grid-cols-6" aria-label="Métricas operativas">
        {[
          ["En revisión", queue.length],
          ["Publicados", publishedCount],
          ["Rechazados", rejectedCount],
          ["Eventos IA", reviewedCount],
          ["Usuarios", users.length],
          ["Empresas", companies.length],
          ["Tickets abiertos", tickets.filter(t => t.status === "open").length],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="text-2xl font-semibold tracking-[-0.04em] text-brand-dark">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          </div>
        ))}
      </section>

      <div className="mt-12 grid gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section id="usuarios" className="min-w-0 scroll-mt-24">
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Accesos</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Usuarios registrados</h2></div>
            <span className="text-sm text-slate-500">Últimos 100</span>
          </div>
          {usersError ? <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No se pudo cargar el listado de usuarios.</p> : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-4 py-3 font-semibold">Usuario</th><th className="px-4 py-3 font-semibold">Registro</th><th className="px-4 py-3 font-semibold">Último acceso</th><th className="px-4 py-3 font-semibold">Estado</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((registeredUser) => (
                    <tr key={registeredUser.id} className="text-slate-600">
                      <td className="px-4 py-3"><p className="font-semibold text-brand-dark">{registeredUser.email ?? "Sin email"}</p><p className="mt-0.5 text-xs text-slate-400">{registeredUser.user_metadata?.company_name ?? "Sin empresa indicada"}</p></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDate(registeredUser.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDate(registeredUser.last_sign_in_at)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${registeredUser.email_confirmed_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{registeredUser.email_confirmed_at ? "Confirmado" : "Pendiente"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">Todavía no hay usuarios registrados.</p> : null}
            </div>
          )}
        </section>

        <section id="empresas" className="min-w-0 scroll-mt-24">
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Altas</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Registros de empresas</h2></div>
            <span className="text-sm text-slate-500">Últimas 50</span>
          </div>
          <AdminCompaniesList initialCompanies={companies} />
        </section>
      </div>

      <section id="anuncios" className="mt-14 scroll-mt-24">
        <div className="border-b border-slate-200 pb-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Moderación</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Revisión de anuncios</h2><p className="mt-2 text-sm text-slate-500">Aprueba o rechaza las publicaciones que esperan revisión humana.</p></div>
        <AdminQueue initialItems={queue} readOnly={false} />
      </section>

      <section id="analitica" className="mt-14 scroll-mt-24">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Tráfico</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Analítica — hoy</h2>
          </div>
          {umamiData?.umamiUrl && (
            <a href={umamiData.umamiUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand">Ver en Umami ↗</a>
          )}
        </div>
        {!umamiData ? (
          <p className="mt-5 text-sm text-slate-500">Configura <code className="rounded bg-slate-100 px-1 text-xs">UMAMI_API_PASS</code> en el entorno para ver estadísticas aquí.</p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Visitantes únicos", umamiData.stats?.visitors?.value ?? 0],
                ["Páginas vistas", umamiData.stats?.pageviews?.value ?? 0],
                ["Visitas", umamiData.stats?.visits?.value ?? 0],
                ["Tasa de rebote", umamiData.stats?.bounces?.value != null && umamiData.stats?.visits?.value ? `${Math.round((umamiData.stats.bounces.value / umamiData.stats.visits.value) * 100)}%` : "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-brand-dark">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            {umamiData.pages.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Página</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Vistas</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {umamiData.pages.map((p: { x: string; y: number }) => (
                        <tr key={p.x} className="text-slate-600">
                          <td className="max-w-[200px] truncate px-4 py-2.5 text-xs font-medium text-brand-dark">{p.x}</td>
                          <td className="px-4 py-2.5 text-right text-xs tabular-nums">{p.y}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {umamiData.referrers.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Referente</th><th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Visitas</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {umamiData.referrers.map((r: { x: string; y: number }) => (
                          <tr key={r.x} className="text-slate-600">
                            <td className="max-w-[200px] truncate px-4 py-2.5 text-xs font-medium text-brand-dark">{r.x || "(directo)"}</td>
                            <td className="px-4 py-2.5 text-right text-xs tabular-nums">{r.y}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section id="tickets" className="mt-14 scroll-mt-24">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-sky">Soporte</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Bandeja de tickets</h2>
          <p className="mt-2 text-sm text-slate-500">Gestiona las consultas y solicitudes de soporte de las empresas registradas.</p>
        </div>
        <AdminTicketInbox initialTickets={tickets as Parameters<typeof AdminTicketInbox>[0]["initialTickets"]} />
      </section>
    </div>
  );
}
