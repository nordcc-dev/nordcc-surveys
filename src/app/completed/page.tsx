"use client"

import Link from "next/link"

export default function CompletedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Thank you for taking your time to complete our survey!
        </h1>
        <p className="text-lg text-muted-foreground">
          If there are any questions do not hesitate to{" "}
          <Link
            href="/contact"
            className="text-primary hover:underline font-medium"
          >
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
