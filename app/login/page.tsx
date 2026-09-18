"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-end px-4 py-4">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
