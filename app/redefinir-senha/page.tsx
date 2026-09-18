import { Suspense } from "react"
import { RedefinirSenhaForm } from "@/components/redefinir-senha-form"

export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Suspense>
          <RedefinirSenhaForm />
        </Suspense>
      </div>
    </main>
  )
}
