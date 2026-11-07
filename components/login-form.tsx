"use client";

import Image from "next/image";
import { LanguageSwitcher, useI18n } from "./i18n-provider";
import type { MessageKey } from "../lib/i18n/messages";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { CreditCard, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const [iin, setIin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if(!/^\d{12}$/.test(iin)){setError("iinError");return}
    setLoading(true);
    try {
      const result = await signIn("credentials", { iin, password, redirect: false });
      if (result?.error) { setError("loginError"); return; }
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await response.json();
      const roleHome = session?.user?.role ? `/${String(session.user.role).toLowerCase()}` : "/login";
      const callback = search.get("callbackUrl");
      router.replace(callback?.startsWith("/") && !callback.startsWith("//") ? callback : roleHome);
      router.refresh();
    } catch { setError("connectionError"); }
    finally { setLoading(false); }
  }

  return <main className="login-page"><section className="login-card"><div className="login-language"><LanguageSwitcher /></div><div className="login-brand"><Image src="/images/happy-town-logo.png" width={112} height={112} alt="Happy Town" priority unoptimized/><span>{t("diary")}</span><h1>{t("welcome")}</h1><p>{t("loginIntro")}</p></div><form onSubmit={submit}><label><span>{t("iin")}</span><div><CreditCard size={18}/><input type="text" inputMode="numeric" maxLength={12} autoComplete="username" value={iin} onChange={event=>setIin(event.target.value.replace(/\D/g,"").slice(0,12))} required autoFocus placeholder={t("iinPlaceholder")} aria-describedby="iin-help"/></div><small id="iin-help">{t("iinHelp")}</small></label><label><span>{t("password")}</span><div><LockKeyhole size={18}/><input type={show?"text":"password"} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required placeholder={t("passwordPlaceholder")}/><button type="button" onClick={()=>setShow(value=>!value)} aria-label={show?t("hidePassword"):t("showPassword")}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>{error&&<p className="login-error" role="alert">{t(error)}</p>}<button className="btn login-submit" disabled={loading}>{loading?<><LoaderCircle className="spin" size={18}/>{t("signingIn")}</>:t("signIn")}</button></form><small>{t("accounts")}</small></section></main>;
}
