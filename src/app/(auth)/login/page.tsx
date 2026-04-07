import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/nh-logo-black.png"
            alt="Nationwide Haul"
            width={48}
            height={48}
          />
          <h1 className="text-lg font-bold text-foreground">
            NH Marketing Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your analytics
          </p>
        </div>

        <form action="/api/auth/signin/google" method="GET">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-secondary transition-colors"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
