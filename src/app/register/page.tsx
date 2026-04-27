"use client";

import React, { useActionState, useState, useTransition, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { registerTenant, type RegisterState } from "./actions";
import { slugify } from "@/utils/slugify";
import Link from "next/link";
import {
  Store, Mail, Lock, Loader2, ArrowRight, CheckCircle2,
  Phone, MessageCircle,
} from "lucide-react";

/* ── Submit Button ─────────────────────────────────────────── */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[14px] py-4 font-['Archivo_Black',sans-serif] text-[15px] uppercase tracking-[.06em] text-white shadow-[0_1px_0_rgba(0,0,0,.08),0_14px_30px_-10px_rgba(67,146,106,.7)] transition-all hover:-translate-y-px hover:shadow-[0_2px_0_rgba(0,0,0,.08),0_18px_36px_-10px_rgba(67,146,106,.85)] active:scale-[0.98] disabled:opacity-60"
      style={{ background: "#43926A" }}
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Creando tu local...
        </>
      ) : (
        <>
          Crear mi local gratis
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

/* ── Password strength ─────────────────────────────────────── */

function getPasswordStrength(pwd: string): number {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

/* ── Page ──────────────────────────────────────────────────── */

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerTenant, initialState);
  const [localName, setLocalName] = useState("");
  const [password, setPassword] = useState("");
  const [, startTransition] = useTransition();

  const slug = slugify(localName);
  const pwdStrength = useMemo(() => getPasswordStrength(password), [password]);

  const segColor = (level: number) => {
    if (pwdStrength >= level) {
      if (pwdStrength === 1) return "bg-[#E25A2B]";
      if (pwdStrength === 2) return "bg-[#E5A347]";
      return "bg-[#43926A]";
    }
    return "bg-[#E9E7E2]";
  };

  return (
    <div className="min-h-screen" style={{ background: "#F6F2EA", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header className="border-b" style={{ borderColor: "rgba(15,18,16,.12)" }}>
        <nav className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-7">
          <Link href="/" className="flex items-center">
            <span className="font-['Archivo_Black',sans-serif] text-[22px]" style={{ color: "#575757" }}>Pedidos</span>
            <span className="font-['Archivo_Black',sans-serif] text-[22px]" style={{ color: "#0F1210" }}>Posta</span>
            <span className="ml-0.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#43926A" }} />
          </Link>
          <Link href="/" className="text-[13px] font-semibold transition-colors hover:text-[#0F1210]" style={{ color: "#575757" }}>
            ← Volver al sitio
          </Link>
        </nav>
      </header>

      {/* ── LAYOUT ── */}
      <main className="mx-auto grid max-w-[1280px] items-start gap-16 px-4 py-8 sm:px-7 sm:py-12 lg:grid-cols-[1.05fr_1fr]">

        {/* ── LEFT: SELL ── */}
        <section className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.1em]" style={{ borderColor: "rgba(15,18,16,.22)" }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#E25A2B" }} />
            Estás a 2 minutos de tu tienda
          </span>

          <h1 className="mt-[18px] font-['Archivo_Black',sans-serif] text-[clamp(48px,6.5vw,88px)] uppercase leading-[.9] tracking-[-0.035em]">
            Abrí tu local<br />
            en <span style={{ color: "#43926A" }}>minutos</span><br />
            no en <span style={{ color: "#E25A2B" }}>meses</span>.
          </h1>

          <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed" style={{ color: "#2a2e2c" }}>
            Creá tu menú digital, recibí pedidos en vivo y dejá de perder plata con comisiones del 1 al 30%.{" "}
            <b className="text-[#0F1210]">Sin tarjeta. Sin permanencia.</b> Empezás hoy.
          </p>

          {/* Benefits */}
          <div className="mt-9 flex flex-col gap-3.5">
            {[
              { title: "10 días gratis, en serio", desc: "Sin tarjeta de crédito. Si no te sirve, cerrás el local y listo." },
              { title: "Te cargamos el menú gratis", desc: "Mandanos tu carta en PDF, foto o WhatsApp. La IA la convierte en tienda." },
              { title: "0% comisiones por pedido", desc: "Precio fijo mensual. La plata que vendés, es tuya." },
              { title: "Soporte por WhatsApp", desc: "Respuesta humana en menos de 10 minutos. De lunes a domingo." },
            ].map((b, i) => (
              <div key={i} className="flex gap-3.5 rounded-[14px] border bg-white p-3.5 px-4" style={{ borderColor: "rgba(15,18,16,.12)" }}>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: "#43926A" }}>✓</span>
                <div>
                  <div className="font-['Archivo',sans-serif] text-[15px] font-extrabold leading-tight">{b.title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug" style={{ color: "#575757" }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-[18px] rounded-[18px] px-[22px] py-5" style={{ background: "#0F1210", color: "#F6F2EA" }}>
            <div className="flex">
              {["JM", "LP", "MR", "+"].map((l, i) => (
                <div
                  key={i}
                  className={`flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 font-['Archivo_Black',sans-serif] text-[11px] ${i > 0 ? "-ml-2.5" : ""}`}
                  style={{
                    borderColor: "#0F1210",
                    background: i === 0 ? "#D7E9DE" : i === 1 ? "#FFD7BD" : i === 2 ? "#EFE8D8" : "#C5DCD0",
                    color: i === 0 ? "#2F6E4F" : i === 1 ? "#B9431C" : i === 2 ? "#0F1210" : "#2F6E4F",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="text-[14px] leading-snug">
              <b className="block font-['Archivo_Black',sans-serif] text-[18px]">500+ locales del interior</b>
              Mercedes, Pergamino, Tandil, Venado Tuerto y más.
            </div>
          </div>

          {/* Quote */}
          <div className="mt-6 rounded-[4px_14px_14px_4px] border-l-4 p-6" style={{ background: "#EFE8D8", borderLeftColor: "#43926A" }}>
            <p className="text-[15px] italic leading-relaxed" style={{ color: "#2a2e2c" }}>
              <span className="mr-1 align-[-12px] font-['Archivo_Black',sans-serif] text-[36px] leading-none" style={{ color: "#43926A" }}>&ldquo;</span>
              En 3 meses dejé de pagar $280.000 en comisiones a otras apps. Y los clientes ahora son míos, no de la app.
            </p>
            <div className="mt-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full font-['Archivo_Black',sans-serif] text-sm text-white" style={{ background: "#43926A" }}>JL</div>
              <div>
                <div className="text-sm font-extrabold">Juan L. — Burger Bros</div>
                <div className="text-xs" style={{ color: "#575757" }}>Pergamino, Buenos Aires · Cliente desde 2025</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── RIGHT: FORM ── */}
        <aside className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:sticky lg:top-6">
          {/* Mobile-only header */}
          <div className="mb-6 text-center lg:hidden">
            <h1 className="font-['Archivo_Black',sans-serif] text-3xl uppercase tracking-tight">
              Creá tu <span style={{ color: "#43926A" }}>local</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#575757" }}>
              Setup en 2 minutos. Sin tarjeta. Sin permanencia.
            </p>
          </div>
          <div className="rounded-2xl sm:rounded-3xl border bg-white p-5 sm:p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,.18)] lg:p-9" style={{ borderColor: "rgba(15,18,16,.12)" }}>
            {/* Card top */}
            <div className="mb-6 flex items-center justify-between">
              <span className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-[.12em]" style={{ color: "#2F6E4F" }}>
                Paso 1 de 1 · Registro
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: "#D7E9DE", color: "#2F6E4F" }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#43926A" }} />
                10 días gratis
              </span>
            </div>

            <h2 className="mb-2 font-['Archivo_Black',sans-serif] text-2xl sm:text-[32px] uppercase leading-[.95] tracking-[-0.025em]">
              Crear mi <span style={{ color: "#43926A" }}>local</span>
            </h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "#575757" }}>
              Setup en 2 minutos. Empezás a recibir pedidos hoy mismo.
            </p>

            {/* Error global */}
            {state.error && (
              <div className="mb-5 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(226,90,43,.3)", background: "rgba(226,90,43,.08)", color: "#B9431C" }}>
                ⚠ {state.error}
              </div>
            )}

            <form action={formAction} className="flex flex-col gap-[18px]">
              {/* Nombre del local */}
              <div>
                <label className="mb-[7px] block text-[11px] font-extrabold uppercase tracking-[.1em]" style={{ color: "#575757" }}>Nombre del local</label>
                <div className={`flex items-center rounded-xl border-[1.5px] px-3.5 transition-all focus-within:border-[#43926A] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(67,146,106,.12)] ${state.fieldError?.name ? "border-[#E25A2B] bg-[#FFF5F0]" : "border-[rgba(15,18,16,.12)] bg-[#F6F2EA]"}`}>
                  <Store className="mr-2.5 h-[18px] w-[18px] flex-shrink-0" style={{ color: "#575757" }} />
                  <input
                    name="name"
                    type="text"
                    placeholder="Ej: Búfalo Grill"
                    autoComplete="organization"
                    value={localName}
                    onChange={(e) => startTransition(() => setLocalName(e.target.value))}
                    className="h-12 flex-1 border-0 bg-transparent text-[15px] text-[#0F1210] outline-none placeholder:text-[#9ea4a1]"
                  />
                </div>
                {state.fieldError?.name && (
                  <p className="mt-1.5 text-xs font-semibold" style={{ color: "#B9431C" }}>{state.fieldError.name}</p>
                )}
              </div>

              {/* URL preview */}
              <div>
                <label className="mb-[7px] block text-[11px] font-extrabold uppercase tracking-[.1em]" style={{ color: "#575757" }}>Tu URL en PedidosPosta</label>
                <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] bg-[#F6F2EA]" style={{ borderColor: "rgba(15,18,16,.12)" }}>
                  <span className="whitespace-nowrap pl-3.5 text-sm" style={{ color: "#575757" }}>pedidosposta.com/</span>
                  <input
                    type="text"
                    value={slug}
                    readOnly
                    tabIndex={-1}
                    className="h-12 flex-1 border-0 bg-transparent text-[15px] font-semibold text-[#0F1210] outline-none"
                    placeholder="tu-local"
                  />
                  {slug && (
                    <span className="flex h-12 items-center border-l-[1.5px] px-3.5 text-[13px] font-bold" style={{ background: "#D7E9DE", color: "#2F6E4F", borderColor: "rgba(15,18,16,.12)" }}>
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Disponible
                    </span>
                  )}
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: slug ? "#2F6E4F" : "#575757" }}>
                  {slug ? <CheckCircle2 className="h-3 w-3" /> : null}
                  Tu link público para compartir en redes y WhatsApp.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="mb-[7px] block text-[11px] font-extrabold uppercase tracking-[.1em]" style={{ color: "#575757" }}>Email del dueño</label>
                <div className={`flex items-center rounded-xl border-[1.5px] px-3.5 transition-all focus-within:border-[#43926A] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(67,146,106,.12)] ${state.fieldError?.email ? "border-[#E25A2B] bg-[#FFF5F0]" : "border-[rgba(15,18,16,.12)] bg-[#F6F2EA]"}`}>
                  <Mail className="mr-2.5 h-[18px] w-[18px] flex-shrink-0" style={{ color: "#575757" }} />
                  <input
                    name="email"
                    type="email"
                    placeholder="vos@tulocal.com"
                    autoComplete="email"
                    className="h-12 flex-1 border-0 bg-transparent text-[15px] text-[#0F1210] outline-none placeholder:text-[#9ea4a1]"
                  />
                </div>
                {state.fieldError?.email && (
                  <p className="mt-1.5 text-xs font-semibold" style={{ color: "#B9431C" }}>{state.fieldError.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="mb-[7px] block text-[11px] font-extrabold uppercase tracking-[.1em]" style={{ color: "#575757" }}>Contraseña</label>
                <div className={`flex items-center rounded-xl border-[1.5px] px-3.5 transition-all focus-within:border-[#43926A] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(67,146,106,.12)] ${state.fieldError?.password ? "border-[#E25A2B] bg-[#FFF5F0]" : "border-[rgba(15,18,16,.12)] bg-[#F6F2EA]"}`}>
                  <Lock className="mr-2.5 h-[18px] w-[18px] flex-shrink-0" style={{ color: "#575757" }} />
                  <input
                    name="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 flex-1 border-0 bg-transparent text-[15px] text-[#0F1210] outline-none placeholder:text-[#9ea4a1]"
                  />
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    <div className={`h-1 flex-1 rounded-sm transition-colors ${segColor(1)}`} />
                    <div className={`h-1 flex-1 rounded-sm transition-colors ${segColor(2)}`} />
                    <div className={`h-1 flex-1 rounded-sm transition-colors ${segColor(3)}`} />
                  </div>
                )}
                <p className="mt-1.5 text-xs" style={{ color: pwdStrength === 3 ? "#2F6E4F" : pwdStrength === 1 ? "#B9431C" : "#575757" }}>
                  {password.length === 0
                    ? "Al menos 8 caracteres. Sumá un número y una mayúscula para más seguridad."
                    : pwdStrength === 1
                      ? "Débil. Sumá una mayúscula y un número."
                      : pwdStrength === 2
                        ? "Buena. Casi perfecta."
                        : "✓ Excelente. Tu contraseña es fuerte."}
                </p>
                {state.fieldError?.password && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: "#B9431C" }}>{state.fieldError.password}</p>
                )}
              </div>

              {/* Terms */}
              <div className="mt-1 flex gap-2.5">
                <input type="checkbox" defaultChecked className="mt-0.5 accent-[#43926A]" />
                <span className="text-xs leading-relaxed" style={{ color: "#575757" }}>
                  Acepto los <a href="#" className="font-semibold text-[#0F1210] underline">términos</a> y la{" "}
                  <a href="#" className="font-semibold text-[#0F1210] underline">política de privacidad</a>.
                  PedidosPosta nunca vende tus datos.
                </span>
              </div>

              <SubmitButton />

              {/* Login link */}
              <p className="mt-2 text-center text-[13px]" style={{ color: "#575757" }}>
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="font-bold text-[#0F1210] underline">
                  Iniciá sesión
                </Link>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3.5 text-xs font-bold uppercase tracking-[.08em]" style={{ color: "#575757" }}>
                <div className="h-px flex-1" style={{ background: "rgba(15,18,16,.12)" }} />
                o
                <div className="h-px flex-1" style={{ background: "rgba(15,18,16,.12)" }} />
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/542324627679?text=Hola!%20Quiero%20crear%20mi%20local%20en%20PedidosPosta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] bg-white text-sm font-bold transition-all hover:border-[#43926A] hover:bg-[#D7E9DE]"
                style={{ borderColor: "rgba(15,18,16,.12)", color: "#0F1210" }}
              >
                <MessageCircle className="h-[18px] w-[18px] text-[#25d366]" />
                Hablar primero por WhatsApp
              </a>

              {/* Trust strip */}
              <div className="flex flex-wrap justify-between gap-2 border-t pt-[18px] text-[11px] font-bold" style={{ borderColor: "rgba(15,18,16,.12)", color: "#575757" }}>
                <span className="inline-flex items-center gap-1"><span style={{ color: "#43926A" }}>✓</span> Sin tarjeta</span>
                <span className="inline-flex items-center gap-1"><span style={{ color: "#43926A" }}>✓</span> Sin permanencia</span>
                <span className="inline-flex items-center gap-1"><span style={{ color: "#43926A" }}>✓</span> Listo en 2 min</span>
              </div>
            </form>
          </div>
        </aside>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mx-auto max-w-[1280px] px-7 pb-10 pt-6 text-center text-xs" style={{ color: "#575757" }}>
        © 2026 PedidosPosta · <a href="#" className="font-semibold">Soporte</a> · <a href="#" className="font-semibold">Términos</a> · <a href="#" className="font-semibold">Privacidad</a>
      </footer>
    </div>
  );
}
