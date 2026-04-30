import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';

export default function NotAuthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Not authorized
        </h1>
        <p className="mt-2 text-sm text-muted">
          Queen Operations is restricted to operators with the{' '}
          <span className="font-semibold text-text">ADMIN</span> role.
        </p>
        <p className="mt-1 text-xs text-subtle">
          If you believe this is a mistake, contact your Queen Operations
          administrator.
        </p>
        <div className="mt-6 space-y-2">
          <SignOutButton>
            <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
              Sign out
            </button>
          </SignOutButton>
          <Link
            href="/sign-in"
            className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-bg"
          >
            Use a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
