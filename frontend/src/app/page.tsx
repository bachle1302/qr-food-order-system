import Link from "next/link";
import { QrCode, LogIn, ChefHat, BarChart3, ShieldCheck, ArrowRight, Layers, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-orange-600/10 blur-[120px]" />
      <div className="absolute bottom-10 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <QrCode className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
              QR Food/RMS
            </span>
          </div>
          <div>
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
            >
              <LogIn className="size-4" />
              Đăng nhập Quản trị
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-20 text-center sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-xs font-semibold text-orange-400">
          <Sparkles className="size-3.5" />
          Hệ thống QR Order & Quản lý vận hành nhà hàng thế hệ mới
        </div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-[1.1] sm:leading-[1.05]">
          Giải Pháp Gọi Món QR <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
            & Vận Hành Nhà Hàng
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Tối ưu hóa quy trình phục vụ từ việc quét QR gọi món tại bàn của thực khách cho đến quy trình chế biến của bếp ăn và quản trị tổng thể của người quản lý trong thời gian thực.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/qr/lj50Jba6nor_Gke-FtfP6lQaup_ZtpaKgXvXbso3q-E"
            className="group inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-6 font-semibold text-slate-200 transition-all hover:bg-slate-850 hover:border-orange-500/40 hover:text-white"
          >
            Trải nghiệm Đặt món (QR Demo)
            <ArrowRight className="size-4 text-orange-500 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 px-6 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:opacity-95 hover:shadow-orange-500/30"
          >
            Bảng Điều khiển Quản trị
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Tính Năng Nổi Bật Của Hệ Thống
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Hỗ trợ đầy đủ các vai trò nghiệp vụ với công nghệ hiện đại, phản hồi thời gian thực và bảo mật tuyệt đối.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950 p-6 transition-all hover:border-orange-500/20 hover:-translate-y-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <QrCode className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">1. Quét QR gọi món</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Khách hàng quét mã QR tại bàn để Check-in, duyệt menu trực quan sinh động và tự đặt đơn mà không cần cài đặt ứng dụng.
            </p>
          </div>

          {/* Card 2 */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950 p-6 transition-all hover:border-orange-500/20 hover:-translate-y-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <ChefHat className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">2. Bếp & Vận hành thời gian thực</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Tích hợp Server-Sent Events (SSE) cập nhật trạng thái đơn hàng lập tức, giúp đầu bếp nhận và điều phối chế biến tức thời.
            </p>
          </div>

          {/* Card 3 */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950 p-6 transition-all hover:border-orange-500/20 hover:-translate-y-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
              <BarChart3 className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">3. Quản trị & Doanh thu</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Thống kê doanh thu biểu diễn biểu đồ trực quan, quản trị cơ sở dữ liệu món ăn, bàn ăn, chương trình khuyến mãi linh hoạt.
            </p>
          </div>

          {/* Card 4 */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950 p-6 transition-all hover:border-orange-500/20 hover:-translate-y-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">4. Bảo mật JWT & Rate Limiting</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Bảo mật phân quyền chặt chẽ giữa Admin và Staff. Ngăn chặn spam bằng cơ chế giới hạn tần suất gửi yêu cầu (Rate Limiting).
            </p>
          </div>

          {/* Card 5 */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950 p-6 transition-all hover:border-orange-500/20 hover:-translate-y-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Layers className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">5. Thiết kế Mobile-First</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Giao diện tối ưu hoàn hảo trên thiết bị di động, tạo cảm giác mượt mà và sang trọng như một ứng dụng gốc trên App Store.
            </p>
          </div>

          {/* Card 6 */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950 p-6 transition-all hover:border-orange-500/20 hover:-translate-y-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <Sparkles className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">6. Đầy đủ dữ liệu mẫu</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Hệ thống tự động nạp (seed) đầy đủ dữ liệu bàn ăn, tài khoản mẫu và các món ăn đa dạng kèm hình ảnh chất lượng cao.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 mt-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} QR Food/RMS. Developed by <span className="text-slate-400 font-semibold">bach le</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}
