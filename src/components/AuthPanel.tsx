"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 簡單 Email 魔術連結登入。未設定 Supabase 時唔會 render。
export default function AuthPanel({ onSignedIn }: { onSignedIn?: () => void }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabase) return null;

  async function sendLink() {
    setError(null);
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
    if (error) setError(error.message);
    else {
      setSent(true);
      onSignedIn?.();
    }
  }

  return (
    <div className="card bg-brand/5">
      <h2 className="text-lg font-bold">登入以安全儲存你嘅資料</h2>
      <p className="mt-1 text-sm text-stone-600">
        我哋會寄一條登入連結去你電郵。你嘅資料只有你自己睇到。
      </p>
      {sent ? (
        <p className="mt-3 rounded-xl bg-green-50 p-3 text-green-800">
          已寄出登入連結，請開你嘅電郵撳入去。
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <input
            type="email"
            className="input"
            placeholder="你的電郵地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn-primary w-full" onClick={sendLink} disabled={!email}>
            寄登入連結俾我
          </button>
          {error && <p className="text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
