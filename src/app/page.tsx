"use client"

import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import {  LogOut, Settings, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const { user, logout, isAuthenticated } = useAuth()

  // const features = [
  //   {
  //     icon: BarChart3,
  //     title: "Survey Analytics",
  //     description: "Get detailed insights with charts, NPS scoring, and completion funnels",
  //   },
  //   {
  //     icon: Users,
  //     title: "User Management",
  //     description: "Manage respondents, track responses, and control access permissions",
  //   },
  //   {
  //     icon: Shield,
  //     title: "Enterprise Security",
  //     description: "Rate limiting, CSRF protection, and secure token-based authentication",
  //   },
  //   {
  //     icon: Zap,
  //     title: "Easy to Use",
  //     description: "Drag-and-drop survey builder with 15+ question types and templates",
  //   },
  // ]

  // const testimonials = [
  //   {
  //     name: "Sarah Johnson",
  //     role: "Product Manager",
  //     content: "SurveyBuilder helped us gather customer feedback efficiently. The analytics are incredible!",
  //     rating: 5,
  //   },
  //   {
  //     name: "Mike Chen",
  //     role: "Marketing Director",
  //     content: "The best survey platform we've used. Clean interface and powerful features.",
  //     rating: 5,
  //   },
  //   {
  //     name: "Emily Davis",
  //     role: "UX Researcher",
  //     content: "Perfect for user research. The completion funnel analysis saved us hours of work.",
  //     rating: 5,
  //   },
  // ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
      <Image
        src="/media/logo.jpg"   // place logo.png in the /public folder
        alt="NORDCC Logo"
        width={230}
        height={230}
        className="object-contain"
      />
    
    </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                  {user?.role === "admin" && (
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href="/admin">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
               
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 text-black" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" className="rounded-full bg-secondary hover:bg-secondary/70 text-white">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/70 rounded-full text-white">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
<section className="py-20 px-4 sm:px-6 lg:px-8">
  <div className="max-w-4xl mx-auto text-center">
    <h1 className="text-5xl font-bold text-secondary mb-6">
      NORDCC <span className="text-primary">Surveys</span>
    </h1>
    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
      Surveys by the Norwegian Dutch Chamber of Commerce that empower businesses and researchers to gather insights.
    </p>

    <div className="flex items-center justify-center gap-4">
      <Button
        asChild
        variant="outline"
        size="lg"
        className="relative overflow-hidden rounded-full group"
      >
        <Link href="/test-survey" className="relative z-10">
          View Demo Survey
          {/* shimmer overlay */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_3s_linear_infinite]" />
        </Link>
      </Button>
    </div>
  </div>

  <style jsx>{`
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `}</style>
</section>


      {/* Features Section
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to create, distribute, and analyze surveys
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <IconComponent className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Trusted by Professionals</h2>
            <p className="text-lg text-muted-foreground">See what our customers say about SurveyBuilder</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Here to complete a survey?</h2>
          <p className="text-lg mb-8 opacity-90">
            Please check your email for the survey link or contact the survey administrator for access.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="rounded-full">
           <Link href="/contact"> 
             <p className="text-lg">
             Contact
             </p>
       
          </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">NORDCC</h3>
              <p className="text-muted-foreground">Survey platform for businesses and research operated by the NORDCC.</p>
            </div>
            {/* <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="hover:text-foreground">
                    Templates
                  </Link>
                </li>
              </ul>
            </div> */}
            <div>
              <h4 className="font-semibold text-black mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
             
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-foreground">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 NORDCC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
