import Link from "next/link";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1 text-center">보험CRM</h1>
        <p className="text-sm text-slate-500 mb-6 text-center">계정을 만들어서 시작하세요</p>
        <SignupForm />
        <p className="mt-4 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
