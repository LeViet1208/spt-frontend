"use client"

import { useRouter } from "next/navigation"
import { BarChart3, TrendingUp, Target } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const carouselImages = [
    {
      src: "/placeholder.svg?height=400&width=600",
      alt: "Modern workspace with laptop and coffee",
      title: "Productive Workspace",
    },
    {
      src: "/placeholder.svg?height=400&width=600",
      alt: "Team collaboration in office",
      title: "Team Collaboration",
    },
    {
      src: "/placeholder.svg?height=400&width=600",
      alt: "Creative design process",
      title: "Creative Process",
    },
    {
      src: "/placeholder.svg?height=400&width=600",
      alt: "Technology and innovation",
      title: "Innovation Hub",
    },
    {
      src: "/placeholder.svg?height=400&width=600",
      alt: "Success and growth",
      title: "Growth & Success",
    },
    {
      src: "/placeholder.svg?height=400&width=600",
      alt: "Digital transformation",
      title: "Digital Future",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SPT Analytics</h1>
            <p className="text-xs text-gray-500">Smart Promotion Tools</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-rows-[1fr_auto] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <div className="w-full max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">SPT - Best analyze tool for retailer</h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Our website allows users to easily upload their data and perform comprehensive analysis with powerful
              tools.
            </p>

            {/* Thêm hero description mới */}
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium bg-gray-50 px-8 py-6 rounded-2xl border border-gray-100">
                A powerful platform for retailers to truly understand the impact of each promotion – from sales uplift
                to changes in customer behavior – enabling smarter decisions and optimized marketing investments.
              </p>
            </div>
          </div>

          {/* Horizontal Scrolling Features */}
          <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900">Three Powerful Features</h2>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Data Visualization</h3>
                <p className="text-gray-600 leading-relaxed">
                  Visualize insights through interactive charts and dashboards to better understand your data patterns
                  and trends.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-8 w-8 text-gray-800" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Advanced Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Perform comprehensive analysis with powerful tools that help you discover hidden insights in your
                  retail data.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gray-300 rounded-xl flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-gray-900" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Campaign Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create and manage promotion campaigns, design, test, and measure effectiveness in real-time for
                  maximum impact.
                </p>
              </div>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto pb-4">
              <div className="flex gap-6 w-max">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-80 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Data Visualization</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Visualize insights through interactive charts and dashboards to better understand your data
                    patterns.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-80 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Advanced Analytics</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Perform comprehensive analysis with powerful tools that help you discover hidden insights.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 w-80 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-gray-900" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900">Campaign Management</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Create and manage promotion campaigns, design, test, and measure effectiveness in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          onClick={() => router.push("/signin")}
        >
          Start Your Analysis
        </button>
      </div>
    </div>
  )
}
