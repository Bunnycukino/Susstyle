import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) {
      toast.success(`${t("welcomeBack")}, ${res.user.name || res.user.email}`);
      const dest = loc.state?.from || (res.user.role === "admin" ? "/admin" : "/chat");
      nav(dest, { replace: true });
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-[#5C6A64] mb-3">SusStyle AI</div>
          <h1 className="font-heading text-4xl text-[#1A2E25]">{t("welcomeBack")}</h1>
        </div>
        <form onSubmit={submit} className="bg-white border border-[#E1DFDA] rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{t("email")}</Label>
            <Input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl h-12 border-[#E1DFDA] bg-[#F9F8F6]"
              data-testid="login-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{t("password")}</Label>
            <Input
              id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl h-12 border-[#E1DFDA] bg-[#F9F8F6]"
              data-testid="login-password"
            />
          </div>
          {err && (
            <div className="text-sm text-[#CC7A6B] bg-[#CC7A6B]/8 rounded-xl px-3 py-2" data-testid="login-error">{err}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full btn-sage text-base" data-testid="login-submit">
            {loading ? "..." : t("signIn")}
          </Button>
          <p className="text-sm text-[#5C6A64] text-center">
            {t("noAccount")}{" "}
            <Link to="/register" className="text-[#8BA888] hover:underline" data-testid="login-to-register">{t("signUp")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
