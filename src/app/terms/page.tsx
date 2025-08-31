"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col bg-white">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-black mb-2">
              Terms &amp; Conditions
            </h1>
            <p className="text-muted-foreground">
              Please read these terms carefully before completing any survey.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Terms of Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-relaxed text-black">
              <section>
                <h2 className="font-semibold text-lg mb-2">Acceptance of Terms</h2>
                <p>
                  By accessing and completing surveys on this platform, you agree to 
                  abide by these Terms &amp; Conditions as well as our{" "}
                  <Link href="/privacy" className="text-primary underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Data Retention</h2>
                <p>
                  We reserve the right to retain survey responses for as long as 
                  deemed necessary for operational, research, or analytical purposes. 
                  If you wish for your responses to be removed, you can{" "}
                  <Link href="/contact" className="text-primary underline">
                    contact us
                  </Link>{" "}
                  directly, and we will process your request in accordance with 
                  applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Fair Use & Anti-Abuse</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>No use of bots, scripts, or automated tools to fill out surveys.</li>
                  <li>No attempts to overload, disrupt, or DDoS the platform.</li>
                  <li>No submission of malicious, offensive, or unlawful content.</li>
                  <li>We reserve the right to suspend or block access for abusive behavior.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Service Availability</h2>
                <p>
                  While we aim to keep the service available at all times, we cannot 
                  guarantee uninterrupted access. We may suspend or modify surveys or 
                  the platform at any time without prior notice.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Intellectual Property</h2>
                <p>
                  All content, branding, and platform design are the property of this 
                  service and may not be copied, reproduced, or redistributed without 
                  explicit permission.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Liability Disclaimer</h2>
                <p>
                  We are not responsible for any damages, direct or indirect, that may 
                  arise from the use of this platform or participation in surveys. Use 
                  of the platform is at your own risk.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Changes to Terms</h2>
                <p>
                  We may update these Terms &amp; Conditions at any time to reflect 
                  changes in law, operational practices, or platform features. 
                  Continued use of the service after changes indicates acceptance.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Contact</h2>
                <p>
                  If you have questions or concerns about these terms, please{" "}
                  <Link href="/contact" className="text-primary underline">
                    contact us
                  </Link>
                  .
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
