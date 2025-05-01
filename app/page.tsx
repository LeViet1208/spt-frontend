export default function Home() {
  // Trang chính có thể có nội dung riêng thay vì chuyển hướng
  // Ví dụ: Trang landing page, giới thiệu sản phẩm, v.v.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Chào mừng đến với RetailAnalytics</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Nền tảng phân tích dữ liệu bán lẻ toàn diện giúp doanh nghiệp của bạn phát triển
      </p>
      <div className="flex gap-4">
        <a href="/sign-in" className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Đăng nhập
        </a>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Xem Dashboard
        </a>
      </div>
    </div>
  )
}
