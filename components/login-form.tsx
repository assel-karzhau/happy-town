"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError("Неверный email или пароль"); return; }
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await response.json();
      const roleHome = session?.user?.role ? `/${String(session.user.role).toLowerCase()}` : "/login";
      const callback = search.get("callbackUrl");
      router.replace(callback?.startsWith("/") && !callback.startsWith("//") ? callback : roleHome);
      router.refresh();
    } catch { setError("Не удалось выполнить вход. Проверьте подключение и повторите."); }
    finally { setLoading(false); }
  }

  return <main className="login-page"><section className="login-card"><div className="login-brand"><Image src="/images/happy-town-logo.png" width={112} height={112} alt="Happy Town" priority unoptimized/><span>Электронный дневник</span><h1>Добро пожаловать</h1><p>Войдите в свой кабинет Happy Town</p></div><form onSubmit={submit}><label><span>Email</span><div><Mail size={18}/><input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} required autoFocus placeholder="name@example.com"/></div></label><label><span>Пароль</span><div><LockKeyhole size={18}/><input type={show?"text":"password"} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required placeholder="Введите пароль"/><button type="button" onClick={()=>setShow(value=>!value)} aria-label={show?"Скрыть пароль":"Показать пароль"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>{error&&<p className="login-error" role="alert">{error}</p>}<button className="btn login-submit" disabled={loading}>{loading?<><LoaderCircle className="spin" size={18}/>Входим…</>:"Войти"}</button></form><small>Аккаунты создаёт администратор учебного центра.</small></section></main>;
}
