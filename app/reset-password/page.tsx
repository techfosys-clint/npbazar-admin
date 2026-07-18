import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-zinc-950 sm:p-8">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[100px] dark:bg-blue-600/20"></div>
        <div className="absolute -bottom-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-accent/10 blur-[100px] dark:bg-indigo-600/20"></div>
      </div>

      <Suspense
        fallback={
          <div className="z-10 flex h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
        }
      >
        <ResetPasswordForm />
      </Suspense>

      <p className="z-10 mt-8 text-center text-xs font-medium text-zinc-500 dark:text-zinc-500">
        Ecomus Admin Panel &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
