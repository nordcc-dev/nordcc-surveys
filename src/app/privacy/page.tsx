"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col bg-white">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-black mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Your privacy and data protection are very important to us.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 text-black">
        <div className="max-w-2xl mx-auto p-6 text-black">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">How We Handle Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-relaxed">
              <section>
                <p>
                  Survey responses are securely stored in a MongoDB database. 
                  Only authorized admin accounts have access. Data is stored 
                  only for as long as it is necessary and relevant to the 
                  purpose for which it was collected.
                </p>
                <p className="mt-2">
                  If you have filled out a survey and would like us to remove 
                  your responses, do not hesitate to{" "}
                  <Link href="/contact" className="text-primary underline">
                    contact us
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Legal Basis</h2>
                <p>
                  We process survey data based on consent. By completing a survey, 
                  you consent to the collection and processing of your responses 
                  for research and analysis purposes.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Data Retention</h2>
                <p>
                  We retain survey responses only for as long as necessary to 
                  fulfill the purposes outlined in this policy. Once data is no 
                  longer needed, it is securely deleted.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Your Rights (GDPR)</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Right to access your data</li>
                  <li>Right to rectify inaccurate data</li>
                  <li>Right to erasure (“right to be forgotten”)</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Right to withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Data Security</h2>
                <p>
                  We implement technical and organizational measures to keep your 
                  data safe, including restricted admin-only access, secure 
                  connections, and database safeguards.
                </p>
              </section>

              <section>
  <h2 className="font-semibold text-lg mb-2">Security Awareness</h2>
  <p>
    While we implement strong safeguards to protect your survey data, it is also 
    important for users to be aware of browser-based risks such as malicious 
    JavaScript injection (sometimes referred to as XSS or SSR script attacks). 
    In worst-case scenarios, these attacks could potentially expose your 
    survey responses or other personal information stored in your browser session.
  </p>
  <p className="mt-2">To reduce your risk, we recommend:</p>
  <ul className="list-disc list-inside space-y-1 mt-2">
    <li>
      <strong>Keep your browser and extensions updated</strong> to patch known 
      security vulnerabilities.
    </li>
    <li>
      <strong>Avoid installing untrusted extensions or clicking suspicious links</strong>, 
      as these are common ways malicious scripts are delivered.
    </li>
    <li>
      <strong>Log out after completing a survey</strong> if you are using a 
      shared or public device to prevent session misuse.
    </li>
  </ul>
</section>


              <section>
                <h2 className="font-semibold text-lg mb-2">International Transfers</h2>
                <p>
                  If data is transferred outside the European Economic Area (EEA), 
                  we ensure that appropriate safeguards are in place, such as 
                  Standard Contractual Clauses (SCCs).
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-lg mb-2">Contact</h2>
                <p>
                  If you have any questions about this Privacy Policy or wish to 
                  exercise your rights, please{" "}
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
