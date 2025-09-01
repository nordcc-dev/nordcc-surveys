// app/surveys/[id]/page.tsx
import type { Metadata } from "next"
import TakeSurvey from "./ClientPage"

// Static metadata (simple + safe). You can switch to generateMetadata if you want it dynamic per id.
export const metadata: Metadata = {
  title: "Take NORDCC Survey",
  description: "Answer a quick survey !",
  openGraph: {
    title: "Complete A NORDCC Survey",
    description: "Answer a quick survey - NORDCC",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Take Survey",
    description: "Answer a quick survey.",
  },
}

// Server component: just renders the client component.
export default function Page() {
  return <TakeSurvey />
}
