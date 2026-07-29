import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-bold text-ink mb-1 text-center">보험CRM</h1>
        <p className="text-sm text-ink-muted mb-6 text-center">로그인해서 계속하세요</p>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-ink-muted">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
