"use client"

import {
  BarChart3,
  User,
  Database,
  Megaphone,
  Settings,
  Plus,
  Eye,
  Zap,
  CheckCircle,
  Upload,
  BarChart,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDatasets } from "@/hooks/use-datasets"
import CampaignPopup from "@/components/campaign-popup"

export default function DashboardPage() {
  const { user, logOut } = useAuth()
  const [activeTab, setActiveTab] = useState("dataset")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hoveredDataset, setHoveredDataset] = useState<number | null>(null)
  const [showCampaignPopup, setShowCampaignPopup] = useState<number | null>(null)
  const router = useRouter()
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use the datasets hook
  const { datasets, loading, error, refreshDatasets } = useDatasets()

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleAddDataset = () => {
    router.push("/dataset/add")
  }

  const handleVisualizeData = (datasetId: number) => {
    console.log("Visualize dataset:", datasetId)
    // Will implement later
  }

  const handleCreateCampaign = (datasetId: number) => {
    router.push(`/dataset/${datasetId}/campaigns/new`)
  }

  const handleRefresh = () => {
    refreshDatasets()
  }

  // Handle dataset hover with delay
  const handleDatasetMouseEnter = (datasetId: number) => {
    setHoveredDataset(datasetId)

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Set timeout to show popup after 2 seconds
    hoverTimeoutRef.current = setTimeout(() => {
      setShowCampaignPopup(datasetId)
    }, 2000)
  }

  // Sửa lại phần xử lý mouse events để popup không biến mất khi hover vào

  // Thay đổi hàm handleDatasetMouseLeave
  const handleDatasetMouseLeave = () => {
    setHoveredDataset(null)

    // Clear timeout if user stops hovering before 2 seconds
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    // KHÔNG tự động ẩn popup khi rời khỏi dataset row
    // Chỉ ẩn khi người dùng rời khỏi cả popup
  }

  const handlePopupMouseEnter = () => {
    // Keep popup visible when hovering over it
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handlePopupMouseLeave = () => {
    // Hide popup when leaving popup area
    setShowCampaignPopup(null)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const tabs = [
    { id: "dataset", label: "Dataset", icon: Database },
    { id: "campaign", label: "Campaign", icon: Megaphone },
    { id: "setting", label: "Setting", icon: Settings },
  ]

  // Function to render import status with appropriate icon and text
  const renderImportStatus = (status: string) => {
    switch (status) {
      case "importing_transaction":
        return (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
            <Upload className="h-3 w-3 animate-pulse" />
            <span className="text-xs">Importing Transaction</span>
          </div>
        )
      case "importing_product_lookup":
        return (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
            <Upload className="h-3 w-3 animate-pulse" />
            <span className="text-xs">Importing Product Lookup</span>
          </div>
        )
      case "importing_causal_lookup":
        return (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
            <Upload className="h-3 w-3 animate-pulse" />
            <span className="text-xs">Importing Causal Lookup</span>
          </div>
        )
      case "import_completed":
        return (
          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs">Import Completed</span>
          </div>
        )
    }
  }

  // Function to render analysis status with appropriate icon and text
  const renderAnalysisStatus = (status: string) => {
    if (status === "not_started") return null

    switch (status) {
      case "analyzing":
        return (
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md ml-2">
            <Clock className="h-3 w-3 animate-pulse" />
            <span className="text-xs">Analyzing</span>
          </div>
        )
      case "analyzed":
        return (
          <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md ml-2">
            <BarChart className="h-3 w-3" />
            <span className="text-xs">Analyzed</span>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left spacer */}
          <div className="w-10"></div>

          {/* Logo - Center */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SPT Analytics</h1>
              <p className="text-xs text-gray-500">Smart Promotion Tools</p>
            </div>
          </div>

          {/* User Menu - Right */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              {user?.photoURL ? (
                <img src={user.photoURL || "/placeholder.svg"} alt="User avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <User className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.displayName || "User"}</p>
                  <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-6 flex justify-center">
          <div className="flex space-x-12">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 py-5 px-4 border-b-2 font-medium text-base transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dataset" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Dataset Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">Dataset Management</h2>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Refresh datasets"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <button
                  onClick={handleAddDataset}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                  title="Add Dataset"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Dataset List */}
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
                    <p className="text-gray-500">Loading datasets...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <p className="text-lg font-medium mb-2">Error loading datasets</p>
                    <p className="text-sm mb-4">{error}</p>
                    <button
                      onClick={handleRefresh}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : datasets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No datasets found</p>
                    <p className="text-sm">Get started by adding your first dataset</p>
                  </div>
                ) : (
                  datasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="relative"
                      onMouseEnter={() => handleDatasetMouseEnter(dataset.id)}
                      onMouseLeave={() => {
                        // Chỉ xóa trạng thái hover, không ẩn popup
                        setHoveredDataset(null)
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current)
                          hoverTimeoutRef.current = null
                        }
                      }}
                    >
                      {/* Dataset Row */}
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        {/* Dataset Name and Status */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Database className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">{dataset.name}</span>
                            <div className="flex items-center">
                              {renderImportStatus(dataset.importStatus)}
                              {dataset.importStatus === "import_completed" &&
                                renderAnalysisStatus(dataset.analysisStatus)}
                            </div>
                          </div>
                        </div>

                        {/* Action Icons - Only enabled for completed imports */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVisualizeData(dataset.id)}
                            disabled={dataset.importStatus !== "import_completed"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              dataset.importStatus === "import_completed"
                                ? "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              dataset.importStatus === "import_completed" ? "Visualize Data" : "Import in progress"
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCreateCampaign(dataset.id)}
                            disabled={dataset.analysisStatus !== "analyzed"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              dataset.analysisStatus === "analyzed"
                                ? "bg-green-100 hover:bg-green-200 text-green-600"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            title={dataset.analysisStatus === "analyzed" ? "Create Campaign" : "Analysis required"}
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Campaign Popup */}
                      {showCampaignPopup === dataset.id && (
                        <div
                          onMouseEnter={() => {
                            // Khi di chuột vào popup, giữ popup hiển thị
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current)
                              hoverTimeoutRef.current = null
                            }
                          }}
                          onMouseLeave={() => {
                            // Khi di chuột ra khỏi popup, ẩn popup
                            setShowCampaignPopup(null)
                          }}
                        >
                          <CampaignPopup
                            datasetId={dataset.id}
                            isVisible={true}
                            onClose={() => setShowCampaignPopup(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "campaign" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Management</h2>
              <p className="text-gray-600">Create and manage your promotion campaigns.</p>
            </div>
          )}

          {activeTab === "setting" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Configure your account and application settings.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
