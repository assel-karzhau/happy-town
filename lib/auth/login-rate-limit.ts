import { createHmac } from "node:crypto";

const WINDOW_MS=10*60*1000;
const MAX_FAILURES=5;
const attempts=new Map<string,{count:number;resetAt:number}>();

function keyFor(iin:string) {
  const secret=process.env.AUTH_SECRET??"happy-town-development-rate-limit";
  return createHmac("sha256",secret).update(iin).digest("hex");
}

export function loginAttemptAllowed(iin:string) {
  const key=keyFor(iin),now=Date.now(),entry=attempts.get(key);
  if(!entry||entry.resetAt<=now){attempts.delete(key);return true}
  return entry.count<MAX_FAILURES;
}

export function recordLoginFailure(iin:string) {
  const key=keyFor(iin),now=Date.now(),entry=attempts.get(key);
  attempts.set(key,!entry||entry.resetAt<=now?{count:1,resetAt:now+WINDOW_MS}:{...entry,count:entry.count+1});
}

export function clearLoginFailures(iin:string) {
  attempts.delete(keyFor(iin));
}
