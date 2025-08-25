"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { ArrowLeft, Download, Calendar, Users, TrendingUp, Star, BarChart3, PieChartIcon, Target } from "lucide-react"
import {  useRouter } from "next/navigation"

// Mock analytics data
const mockSurveyData = {
  id: "1",
  title: "Customer Satisfaction Survey",
  totalResponses: 247,
  completionRate: 78.5,
  avgCompletionTime: "4m 32s",
  npsScore: 42,
}

const responseOverTime = [
  { date: "2024-01-01", responses: 12 },
  { date: "2024-01-02", responses: 19 },
  { date: "2024-01-03", responses: 8 },
  { date: "2024-01-04", responses: 23 },
  { date: "2024-01-05", responses: 31 },
  { date: "2024-01-06", responses: 18 },
  { date: "2024-01-07", responses: 27 },
  { date: "2024-01-08", responses: 35 },
  { date: "2024-01-09", responses: 22 },
  { date: "2024-01-10", responses: 29 },
]

const completionFunnel = [
  { step: "Started", count: 315, percentage: 100 },
  { step: "Question 1", count: 298, percentage: 94.6 },
  { step: "Question 2", count: 285, percentage: 90.5 },
  { step: "Question 3", count: 271, percentage: 86.0 },
  { step: "Question 4", count: 263, percentage: 83.5 },
  { step: "Question 5", count: 255, percentage: 81.0 },
  { step: "Completed", count: 247, percentage: 78.5 },
]

const ratingDistribution = [
  { rating: "1 Star", count: 8, percentage: 3.2 },
  { rating: "2 Stars", count: 15, percentage: 6.1 },
  { rating: "3 Stars", count: 42, percentage: 17.0 },
  { rating: "4 Stars", count: 89, percentage: 36.0 },
  { rating: "5 Stars", count: 93, percentage: 37.7 },
]

const npsDistribution = [
  { category: "Detractors (0-6)", count: 45, percentage: 18.2, color: "#ef4444" },
  { category: "Passives (7-8)", count: 98, percentage: 39.7, color: "#f59e0b" },
  { category: "Promoters (9-10)", count: 104, percentage: 42.1, color: "#10b981" },
]

const multipleChoiceData = [
  { option: "Social Media", count: 89, percentage: 36.0 },
  { option: "Google Search", count: 67, percentage: 27.1 },
  { option: "Friend Referral", count: 45, percentage: 18.2 },
  { option: "Advertisement", count: 32, percentage: 13.0 },
  { option: "Other", count: 14, percentage: 5.7 },
]

const chartConfig = {
  responses: {
    label: "Responses",
    color: "hsl(var(--chart-1))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--chart-2))",
  },
}

export default function SurveyAnalytics() {
  //const params = useParams()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState("7d")

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: string | React.ComponentType<{ className?: string }>
    trend?: { value: string; positive: boolean }
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm ${trend.positive ? "text-green-600" : "text-red-600"}`}
              >
                <TrendingUp className="h-3 w-3" />
                {trend.value}
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-secondary" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{mockSurveyData.title}</h1>
              <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Responses"
            value={mockSurveyData.totalResponses.toLocaleString()}
            icon={Users}
            trend={{ value: "+12% from last week", positive: true }}
          />
          <StatCard
            title="Completion Rate"
            value={`${mockSurveyData.completionRate}%`}
            icon={Target}
            trend={{ value: "+3.2% from last week", positive: true }}
          />
          <StatCard
            title="Avg Completion Time"
            value={mockSurveyData.avgCompletionTime}
            icon={Calendar}
            trend={{ value: "-15s from last week", positive: true }}
          />
          <StatCard
            title="NPS Score"
            value={mockSurveyData.npsScore}
            subtitle="Net Promoter Score"
            icon={Star}
            trend={{ value: "+5 from last week", positive: true }}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="nps">NPS</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                    Response Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={responseOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="responses"
                          stroke="hsl(var(--chart-1))"
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-secondary" />
                    Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={multipleChoiceData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="hsl(var(--chart-1))"
                          dataKey="count"
                          label={({ option, percentage }) => `${option}: ${percentage}%`}
                        >
                          {multipleChoiceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responseOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="responses"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rating" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { question: "How would you rate our service?", avgRating: 4.2, responses: 247 },
                      { question: "How likely are you to recommend us?", avgRating: 7.8, responses: 247 },
                      { question: "How did you hear about us?", avgRating: null, responses: 247 },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.question}</p>
                          <p className="text-xs text-muted-foreground">{item.responses} responses</p>
                        </div>
                        {item.avgRating && (
                          <div className="text-right">
                            <p className="font-bold text-lg">{item.avgRating}</p>
                            <p className="text-xs text-muted-foreground">avg rating</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nps" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>NPS Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={npsDistribution} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="category" type="category" width={120} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>NPS Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">{mockSurveyData.npsScore}</div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Good</Badge>
                    </div>
                    <div className="space-y-3">
                      {npsDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-medium">{item.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{item.count}</span>
                            <span className="text-sm text-muted-foreground ml-1">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completionFunnel.map((step, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{step.step}</span>
                        <div className="text-right">
                          <span className="font-bold">{step.count}</span>
                          <span className="text-sm text-muted-foreground ml-2">({step.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-300"
                          style={{ width: `${step.percentage}%` }}
                        ></div>
                      </div>
                      {index < completionFunnel.length - 1 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Drop-off: {completionFunnel[index].count - completionFunnel[index + 1].count} (
                          {(
                            ((completionFunnel[index].count - completionFunnel[index + 1].count) /
                              completionFunnel[index].count) *
                            100
                          ).toFixed(1)}
                          %)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
