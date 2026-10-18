# 🌉 Đà Nẵng Hybrid Tourism Map (PoC)

[![Phase](https://img.shields.io/badge/Phase-0%20Spike%20Completed-success)](docs/PROGRESS_REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![MapLibre](https://img.shields.io/badge/MapLibre%20GL-v4.7-brightgreen)](https://maplibre.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-black)](https://threejs.org/)

Ứng dụng bản đồ du lịch số tương tác cao cấp kết hợp giữa **MapLibre GL JS** (Bản đồ số địa lý) và **Three.js** (Đồ họa 3D không gian), tích hợp lộ trình tham quan bám theo đường phố thực tế (**OSRM**), phân tầng hiệu năng di động thích ứng (**Quality Tiers**) và **Trợ lý AI Du lịch có kiểm chứng (Grounded AI)**.

---

## ✨ Tính Năng Nổi Bật

- **🗺️ Bản đồ Địa lý Chuẩn xác (WGS-84)**: Tọa độ 12 địa điểm và 5 công trình trọng điểm được trích xuất và đồng bộ 100% theo Google Maps.
- **🏛️ 5 Mô hình 3D Điểm nhấn (Landmarks)**:
  - Cầu Rồng (*Dragon Bridge*)
  - Cầu Sông Hàn (*Han River Swing Bridge*)
  - Công viên Vườn tượng APEC
  - Nhà thờ Chính tòa Đà Nẵng (*Nhà thờ Con Gà*)
  - Bảo tàng Đà Nẵng (*Thành Điện Hải*)
  - *Tổng dung lượng 5 mô hình chỉ ~304 KB, tải siêu tốc dưới 0.2s.*
- **🎯 Chống rung ma trận (Anti-Jitter Float32)**: Giữ mô hình 3D đứng vững trên mặt đất khi zoom (12–19), xoay (0–360°) và nghiêng pitch (0–60°).
- **🚶 Tuyến Tham quan Thực tế (OSRM Road Routing)**: Tự động tính toán đường đi bám theo mạng lưới giao thông đường bộ ven sông Hàn thay vì đường chim bay. Tuân thủ nguyên tắc *"User interaction wins"* (tự hủy animation khi người dùng can thiệp).
- **📱 Phân tầng Hiệu năng Thích ứng (Quality Tiers)**: Hỗ trợ 3 mức `Low`, `Medium`, `High`. Tự động rơi về biểu tượng 2D Fallback khi GPU yếu hoặc mất ngữ cảnh WebGL.
- **🤖 Trợ lý AI Du lịch có Kiểm chứng**: Ngăn chặn ảo giác tọa độ, chỉ điều khiển bản đồ thông qua danh sách địa điểm hợp lệ trong cơ sở dữ liệu.
- **📊 Performance Telemetry HUD**: Bảng giám sát thời gian thực: FPS, frame time (ms), WebGL draw calls, triangle count và bộ kiểm thử tự động Gate A.

---

## 🏗️ Cấu Trúc Dự Án (Monorepo)

```text
tourism-map-poc/
├── apps/
│   └── web/                     # Ứng dụng Frontend React + Vite + Tailwind CSS
│       ├── public/assets/       # 3D GLB models, ảnh POI và manifests JSON
│       └── src/                 # Giao diện UI, Drawers, HUD, AI Chat Modal
├── packages/
│   ├── map-engine/              # Lõi điều khiển bản đồ (SceneManager, Three.js Layer, OSRM)
│   └── shared-types/            # Kiểu dữ liệu dùng chung (Place, TourRoute, LandmarkManifest)
├── tools/
│   └── generate_models.mjs      # Procedural 3D model generator xuất file GLB
└── docs/                        # Tài liệu kiến trúc và báo cáo tiến độ kỹ thuật
    ├── SPECIFICATION.md         # Đặc tả kỹ thuật và kế hoạch bàn giao
    ├── PROGRESS_REPORT.md       # Báo cáo tiến độ nghiệm thu Gate A
    └── BAO_CAO_TIEN_DO_CONG_NGHE.md # Báo cáo toàn diện công nghệ & lộ trình Phase 1
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18 trở lên (Khuyên dùng Node.js 20 LTS).
- **Package Manager**: `npm` (hoặc `pnpm` / `yarn`).

### 2. Cài đặt các bước

```bash
# 1. Clone mã nguồn từ GitHub
git clone https://github.com/BAPthangln/tourism-map-poc.git
cd tourism-map-poc

# 2. Cài đặt các thư viện phụ thuộc (Monorepo dependencies)
npm install

# 3. Tạo file cấu hình môi trường từ mẫu
cp .env.example apps/web/.env

# 4. Khởi chạy môi trường phát triển (Dev Server)
npm run dev
```

Sau khi chạy lệnh trên, ứng dụng sẽ khởi động tại:  
👉 **`http://localhost:5173/`**

---

## 🛠️ Các Lệnh Thao Tác (Scripts)

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Khởi chạy Vite dev server cho web (`http://localhost:5173/`) |
| `npm run build` | Kiểm tra TypeScript và build đóng gói toàn bộ workspaces |
| `npm run build --workspace=apps/web` | Build đóng gói riêng ứng dụng Web phục vụ deploy |
| `node tools/generate_models.mjs` | Tái tạo lại 5 file 3D `.glb` bằng Three.js Generator |

---

## 🔑 Cấu Hình Dịch Vụ Bên Ngoài (Optional)

Dự án được thiết kế theo nguyên tắc **Zero-barrier**:
- Mặc định khởi chạy hoàn toàn **miễn phí**, không cần đăng ký API key nào (Bản đồ nền dùng Carto/Esri/OSM, định tuyến dùng OSRM public, AI dùng cơ chế mô phỏng an toàn cục bộ).
- Khi muốn mở rộng tích hợp các nhà cung cấp thương mại, chỉ cần điền vào file `apps/web/.env`:
  - `VITE_MAPTILER_API_KEY`: Key vector tile của MapTiler.
  - `VITE_CARTO_API_KEY`: Key của Carto.
  - `VITE_MAPBOX_ACCESS_TOKEN`: Token của Mapbox.

---

## 📖 Tài Liệu Tham Khảo Kỹ Thuật

- 📋 [Đặc Tả Kỹ Thuật Chi Tiết (SPECIFICATION.md)](docs/SPECIFICATION.md)
- 📊 [Báo Cáo Nghiệm Thu Gate A (PROGRESS_REPORT.md)](docs/PROGRESS_REPORT.md)
- 🧭 [Báo Cáo Toàn Diện Công Nghệ & Lộ Trình Phase 1](docs/BAO_CAO_TIEN_DO_CONG_NGHE.md)

---
*Phát triển bởi Đội ngũ Kỹ sư Công nghệ — Dự án Bản đồ Du lịch Hybrid 3D.*
