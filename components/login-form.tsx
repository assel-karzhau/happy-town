"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { CreditCard, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [iin, setIin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if(!/^\d{12}$/.test(iin)){setError("ИИН должен содержать ровно 12 цифр");return}
    setLoading(true);
    try {
      const result = await signIn("credentials", { iin, password, redirect: false });
      if (result?.error) { setError("Неверный ИИН или пароль"); return; }
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await response.json();
      const roleHome = session?.user?.role ? `/${String(session.user.role).toLowerCase()}` : "/login";
      const callback = search.get("callbackUrl");
      router.replace(callback?.startsWith("/") && !callback.startsWith("//") ? callback : roleHome);
      router.refresh();
    } catch { setError("Не удалось выполнить вход. Проверьте подключение и повторите."); }
    finally { setLoading(false); }
  }

  return <main className="login-page"><section className="login-card"><div className="login-brand"><Image src="/images/happy-town-logo.png" width={112} height={112} alt="Happy Town" priority unoptimized/><span>Электронный дневник</span><h1>Добро пожаловать</h1><p>Войдите в свой кабинет Happy Town</p></div><form onSubmit={submit}><label><span>ИИН</span><div><CreditCard size={18}/><input type="text" inputMode="numeric" maxLength={12} autoComplete="username" value={iin} onChange={event=>setIin(event.target.value.replace(/\D/g,"").slice(0,12))} required autoFocus placeholder="Введите 12 цифр ИИН" aria-describedby="iin-help"/></div><small id="iin-help">Только 12 цифр</small></label><label><span>Пароль</span><div><LockKeyhole size={18}/><input type={show?"text":"password"} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required placeholder="Введите пароль"/><button type="button" onClick={()=>setShow(value=>!value)} aria-label={show?"Скрыть пароль":"Показать пароль"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>{error&&<p className="login-error" role="alert">{error}</p>}<button className="btn login-submit" disabled={loading}>{loading?<><LoaderCircle className="spin" size={18}/>Входим…</>:"Войти"}</button></form><small>Аккаунты создаёт администратор учебного центра.</small></section></main>;
}
