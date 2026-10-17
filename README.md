# Đà Nẵng Hybrid Tourism Map (PoC Phase 0)

Ứng dụng web bản đồ du lịch tương tác kết hợp giữa bản đồ số địa lý (**MapLibre GL JS**) và đồ họa 3D địa danh (**Three.js Custom Layer**), tích hợp cơ chế điều khiển camera cinematic, phân tầng hiệu năng mobile (Quality Tiers) và Trợ lý AI du lịch có kiểm chứng (Grounded AI).

---

## 🚀 Khởi Chạy Nhanh Trên Máy Cục Bộ (Local)

### 1. Yêu cầu hệ thống
* **Node.js:** Phiên bản 18+ trở lên (Đã cài sẵn Node.js v20 LTS trên máy).

### 2. Các bước khởi chạy

Mở Terminal của bạn và chạy các lệnh sau:

```bash
# 1. Đi tới thư mục dự án:
cd /Users/thangmid/PROJECT/map

# 2. Khởi động môi trường phát triển (Dev server):
npm run dev
```

Sau khi chạy lệnh trên, mở trình duyệt của bạn và truy cập:
👉 **[http://localhost:5173/](http://localhost:5173/)**

*(Nếu muốn truy cập từ điện thoại kết nối chung mạng Wi-Fi, mở địa chỉ IP hiển thị trên màn hình terminal, ví dụ: `http://192.168.1.x:5173/`)*.

---

## 🔑 Có cần đăng ký dịch vụ bên ngoài nào không?

* **GIAI ĐOẠN HIỆN TẠI (PHASE 0): KHÔNG CẦN ĐĂNG KÝ BẤT KỲ DỊCH VỤ NÀO!**
  * Bản đồ nền: Đang dùng Esri World Street Map & OSM (hoàn toàn miễn phí, không cần API key, không có watermark).
  * 3D Models: Đã có sẵn 3 mô hình GLB trong thư mục `public/assets/models/` (tổng tải chỉ 188 KB).
  * Dữ liệu POI: Đã seed sẵn 17 địa điểm thực tế tại Sông Hàn trong file JSON.
  * Trợ lý AI: Đang chạy chế độ Grounded Mock có kiểm chứng dữ liệu, không tốn phí gọi API đám mây.

* **KHI MỞ RỘNG (PHASE 1 & THƯƠNG MẠI):**
  * Tùy chọn đăng ký thêm khi cần nâng cấp:
    1. **Vector Tile Provider:** [MapTiler Cloud](https://cloud.maptiler.com) (nếu muốn tự thiết kế style vector riêng).
    2. **LLM API Key:** [Google AI Studio](https://aistudio.google.com) (cho Gemini API) hoặc OpenAI API.
    3. Điền các key tương ứng vào file `.env` theo mẫu tại `.env.example`.

---

## 🛠️ Các Lệnh Thường Dùng (Scripts)

```bash
# Chạy ứng dụng web môi trường dev:
npm run dev

# Kiểm tra kiểu dữ liệu (TypeScript Typecheck):
npm run typecheck --workspace=packages/shared-types
npm run typecheck --workspace=packages/map-engine

# Build sản phẩm đóng gói (Production build):
npm run build --workspace=apps/web

# Tự động tái tạo lại các file 3D GLB (nếu cần):
node tools/generate_models.mjs
```

---

## 📖 Tài Liệu Chi Tiết
Xem toàn bộ đặc tả kiến trúc kỹ thuật tại: [docs/SPECIFICATION.md](docs/SPECIFICATION.md).
