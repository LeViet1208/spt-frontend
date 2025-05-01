import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          <span className="text-xl font-bold">RetailAnalytics</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="outline">Đăng nhập</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Phân tích dữ liệu bán lẻ thông minh
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Giải pháp toàn diện giúp bạn phân tích dữ liệu bán hàng, hàng tồn kho và khách hàng một cách hiệu quả.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-in">
                  <Button size="lg">Bắt đầu ngay</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    Xem dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-gray-500">© 2023 RetailAnalytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
