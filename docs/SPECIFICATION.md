# HYBRID TOURISM MAP — TECHNICAL ARCHITECTURE & PoC SPECIFICATION

> **Phiên bản:** 1.0  
> **Ngày:** 15/10/2026  
> **Trạng thái:** Phase 0 Feasibility Spike Completed  
> **Đối tượng:** Product Owner, Tech Lead, Frontend/Graphics Engineer, Backend/AI Engineer, 3D Designer, QA  

---

## 1. Executive Summary
Xây dựng ứng dụng web bản đồ du lịch địa phương theo hướng **Hybrid Map**: bản đồ địa lý thật, phong cách đồ họa tùy biến, các địa danh minh họa 2D/3D, camera animation và trợ lý AI có thể truy vấn địa điểm, giải thích nội dung và phát lệnh tương tác với bản đồ.

* **Định hướng sản phẩm:** Không thay thế Google Maps; tập trung vào khám phá, kể chuyện địa phương, giới thiệu địa điểm và hành trình cá nhân hóa. Nền tảng có thể tái sử dụng cho nhiều địa phương bằng cách thay dataset, style và assets.
* **Định hướng PoC:** Chứng minh pipeline đồ họa và tính khả thi trên mobile trước; chỉ sau khi đạt các quality gates mới mở rộng CMS, AI và sản phẩm thương mại.

---

## 2. Mục tiêu, Phạm vi & Phi mục tiêu

### 2.1. Mục tiêu
1. Hiển thị bản đồ vector địa lý chính xác với theme du lịch tùy biến.
2. Render landmark GLB theo tọa độ, tỷ lệ, hướng và độ cao có kiểm chứng.
3. Camera fly-to, marker selection, route reveal và cinematic sequence có thể hủy.
4. AI truy vấn POI đã kiểm duyệt và trả về các map actions hợp lệ.
5. Chạy ổn định trên desktop và thiết bị mobile tầm trung, có fallback 2D/2.5D.
6. Chứng minh tính tái sử dụng: thay dataset/manifest cho địa phương khác mà không sửa map core.

### 2.2. Phạm vi PoC
* **Vùng mẫu:** Khu vực Sông Hàn, TP. Đà Nẵng (tọa độ trung tâm: `lng: 108.2255, lat: 16.0610`).
* **Dữ liệu:** 15–20 POI, 3 landmark GLB (Cầu Rồng, Cầu Sông Hàn, Công viên APEC), 1 tuyến tour 3–5 điểm dừng, 1 visual theme du lịch.
* **Ngôn ngữ:** Tiếng Việt (schema dự phòng đa ngôn ngữ).
* **AI Assistant:** Tìm kiếm địa điểm, giải thích ngắn có nguồn, điều khiển camera bản đồ, đề xuất tuyến.
* **Telemetry:** Bộ công cụ đo FPS/frame time, WebGL state và draw calls trực tiếp trên UI.

### 2.3. Không thuộc PoC (Non-goals)
* Booking, thanh toán trực tuyến.
* Dữ liệu giao thông thời gian thực trên diện rộng, crowdsourcing.
* Bản đồ offline hoàn chỉnh, AR/VR, 3D toàn thành phố.
* CMS đa tenant, tự động crawl nội dung hàng loạt, định tuyến giao thông tự xây dựng.

---

## 3. Nguyên tắc Kiến trúc (Architectural Principles)
1. **MapLibre là Source of Truth:** Camera, phép chiếu và tọa độ địa lý do MapLibre quản lý; Three.js chỉ là custom layer render mô hình địa lý.
2. **Separation of Concerns:** Map Engine, Tourism Data, AI Orchestration và UI độc lập thông qua typed contracts.
3. **Data-driven Visuals:** Mỗi POI/landmark/tour đều có manifest độc lập; tránh hardcode từng địa danh vào component.
4. **User Interaction Wins:** Mọi camera tour/AI animation phải bị hủy ngay lập tức khi người dùng can thiệp (chạm, kéo, zoom).
5. **Progressive Enhancement:** Base map và POI vẫn sử dụng tốt khi thiết bị yếu hoặc WebGL 3D gặp sự cố (chế độ 2D Fallback).
6. **Grounded AI:** AI không tự bịa tọa độ, giờ mở cửa hay tuyến đường; chỉ gọi tool và tham chiếu các ID đã được kiểm duyệt.
7. **Measurable PoC:** Quyết định kỹ thuật dựa trên benchmark thực tế, không dựa vào cảm nhận demo.

---

## 4. Technology Decisions

| Hạng mục | Công nghệ lựa chọn | Ghi chú & Đánh giá |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Khởi tạo nhanh, tối ưu render hiệu năng cao |
| **Map Engine** | MapLibre GL JS v4 | Vector map, style, camera, CustomLayerInterface |
| **3D Rendering** | Three.js (r169) + GLTFLoader | Render glTF/GLB theo phép chiếu Mercator |
| **State Management**| Zustand | Nhẹ nhàng, quản lý trạng thái selection & quality |
| **Styles & Icons** | Tailwind CSS v4, Lucide Icons | Giao diện hiện đại glassmorphism |
| **Tile Provider** | Esri World Street / OSM / MapTiler | Không watermark, ổn định, hỗ trợ vector/raster |
| **3D Assets** | Low-poly GLB ($\le$ 500KB/model) | Budget ban đầu $\le$ 3MB tổng tải |
| **AI Integration** | Grounded Schema Tool Calling | Trích dẫn nguồn, phát payload `MapAction` |

---

## 5. Cấu trúc Source Code Monorepo

```
map/
├── apps/
│   └── web/                   # Ứng dụng giao diện người dùng (React + Vite)
│       ├── public/assets/
│       │   ├── manifests/     # JSON dataset: danang_places, danang_landmarks, danang_routes
│       │   └── models/        # Các file 3D nhị phân (.glb): dragon_bridge, han_bridge, apec_park
│       └── src/
│           ├── components/    # PerformanceHUD, POIDetailDrawer, TourPanel, GateATestModal, AIAssistantModal
│           └── App.tsx        # Điều phối giao diện trung tâm
├── packages/
│   ├── map-engine/            # Lõi engine bản đồ độc lập
│   │   └── src/
│   │       ├── core/          # MapController, SceneManager
│   │       ├── layers/        # Landmark3DLayer (Three.js), POILayer, RouteLayer
│   │       ├── animation/     # CameraController, AnimationDirector
│   │       ├── assets/        # AssetManager (Cache, GLTF load, Dispose GL)
│   │       └── performance/   # QualityManager, PerformanceMonitor
│   └── shared-types/          # Type definitions dùng chung
├── tools/
│   └── generate_models.mjs    # Script sinh model 3D GLB chuẩn budget
├── .env.example               # Mẫu cấu hình biến môi trường
└── .gitignore                 # Bảo mật môi trường và file build
```

---

## 6. Kịch bản Kiểm thử Acceptance Criteria (Gate A)

* **MAP-01:** Zoom phạm vi 12 → 19: Mô hình 3D bám chắc tọa độ, không bị trôi do sai số dấu phẩy động float32.
* **MAP-02:** Xoay 360°, nghiêng pitch 0° → 65°: Ma trận phối cảnh Three.js đồng bộ hoàn hảo với MapLibre.
* **ANI-01:** User Override: Khi camera đang chạy tour, người dùng kéo bản đồ sẽ lập tức dừng tour và trả quyền điều khiển.
* **AST-01:** Asset Fallback: Tải thử file 3D lỗi 404, hệ thống tự động rơi về 2D marker mà không sập WebGL context.
* **MOB-01:** Low Quality Tier: Chuyển sang Low tier, Three.js tắt hoàn toàn, hiển thị 2D marker giúp mobile mượt mà.
