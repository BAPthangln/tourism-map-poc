# BÁO CÁO TIẾN ĐỘ DỰ ÁN & ĐỐI CHIẾU KIẾN TRÚC POc
## HYBRID TOURISM MAP — PROGRESS REPORT & ROADMAP

> **Thời điểm cập nhật:** 18/10/2026  
> **Trạng thái:** Hoàn tất Phase 0 (Gate A) — Chuẩn bị Phase 1 PoC  
> **Tài liệu đối chiếu:** [`docs/SPECIFICATION.md`](SPECIFICATION.md)  

---

## 1. Tổng quan Tiến độ Thực tế

| Góc độ đánh giá | Tiến độ đạt được | Đánh giá & Ý nghĩa kỹ thuật |
|---|:---:|---|
| **Phase 0 — Feasibility Spike** | **100%** | Hoàn thành toàn bộ tiêu chuẩn Gate A: WebGL context ổn định, khử trôi tọa độ, 17 POI, 3 GLB mẫu, tuyến tour động, cơ chế "User wins" và 2D Fallback. |
| **Rủi ro kỹ thuật cốt lõi (Technical Risks)** | **~90%** | Các rủi ro lớn nhất về render WebGL, xung đột state giữa MapLibre & Three.js, tràn bộ nhớ GPU mobile và ảo giác tọa độ AI đều đã được giải quyết. |
| **Toàn bộ đặc tả tài liệu (PoC hoàn chỉnh)** | **~45% – 50%** | Đã hoàn tất toàn bộ phần lõi Frontend/Map Engine. Khối lượng còn lại thuộc về Backend cơ sở dữ liệu thật, 3D Designer xuất mô hình và kết nối Cloud AI. |

---

## 2. Chi tiết Tiến độ Theo Từng Cấu Phần (Workstreams)

### 2.1. Lõi đồ họa & Bản đồ (Map Engine & Visual Controller) — Đạt ~80%
* ✅ **Đã hoàn thành:**
  * Kiến trúc Monorepo tách bạch: `MapController`, `SceneManager`, `Landmark3DLayer`, `CameraController`, `AnimationDirector`, `QualityManager`.
  * Chuyển đổi WGS84 sang tọa độ Mercator với scale theo mét tại vĩ độ sông Hàn Đà Nẵng ($\approx 16.06^\circ\text{N}$).
  * Khử rung ma trận (Anti-jitter float32): Tách ma trận biến đổi cục bộ, giữ mô hình đứng vững khi zoom từ 12 đến 19.
  * Cơ chế hủy animation khi người dùng thao tác (*User Interaction Wins* qua các sự kiện `dragstart`, `zoomstart`, `touchstart`).
  * Phân tầng chất lượng đồ họa (*Quality Tiers: Low/Medium/High*), tự động rơi về 2D Fallback Marker khi máy yếu.
  * Hỗ trợ cấu hình nguồn bản đồ linh hoạt qua biến môi trường (Esri, OSM, MapTiler, CARTO).
* ⏳ **Kế hoạch Phase 1:**
  * Bổ sung cơ chế quản lý LOD (Level of Detail) theo khoảng cách camera.
  * Tùy chọn chuyển đổi sang Vector Tiles độc quyền khi có key thương mại.

### 2.2. Dữ liệu Du lịch & Quản lý Vị trí (Tourism Data) — Đạt ~40%
* ✅ **Đã hoàn thành:**
  * Bộ dữ liệu seed chuẩn 17 POI thực tế tại Sông Hàn (địa chỉ, giá vé, giờ mở cửa, trích dẫn nguồn xác thực).
  * 1 Tuyến Tour mẫu 5 điểm dừng kết nối các công trình tiêu biểu hai bên bờ sông Hàn.
  * Bộ hợp đồng kiểu dữ liệu tĩnh (`@tourism-map/shared-types`): `Place`, `LandmarkManifest`, `TourRoute`, `MapAction`, `SceneState`.
* ⏳ **Kế hoạch Phase 1:**
  * Dựng Backend REST API độc lập (`Fastify` hoặc `NestJS/Express`).
  * Chuyển dữ liệu JSON seed vào Cơ sở dữ liệu quan hệ có hỗ trợ truy vấn không gian `PostgreSQL + PostGIS`.

### 2.3. Trợ lý AI Du lịch có Kiểm chứng (AI Orchestration) — Đạt ~40%
* ✅ **Đã hoàn thành:**
  * Giao diện chat tương tác trực tiếp trên bản đồ.
  * Cơ chế **Grounded AI**: Phân tích câu hỏi, tra cứu ID địa điểm từ dataset có sẵn, trích dẫn nguồn và phát sinh payload `MapAction` (`camera.flyTo`, `route.reveal`) an toàn, không bịa đặt tọa độ.
* ⏳ **Kế hoạch Phase 1:**
  * Đấu nối API Cloud LLM thực tế (Google Gemini API hoặc OpenAI GPT-4o).
  * Bổ sung bộ lọc prompt injection và rate limit tại server API.

### 2.4. Tài nguyên Đồ họa 3D (3D Assets Pipeline) — Đạt ~40%
* ✅ **Đã hoàn thành:**
  * Script tự động sinh 3 file GLB low-poly chuẩn kích thước: Cầu Rồng, Cầu Sông Hàn, Công viên APEC.
  * Tổng dung lượng 3D ban đầu chỉ **188 KB** (đạt xuất sắc budget $\le 3\text{ MB}$).
  * Hệ thống Landmark Manifest nạp động qua tọa độ GPS và heading xoay theo hướng thực tế.
* ⏳ **Kế hoạch Phase 1:**
  * Tiếp nhận file mô hình 3D thực tế từ 3D Designer (mô hình Blender chi tiết hơn, tối ưu UV/Texture KTX2/Meshopt).

### 2.5. Kiểm thử & Đo lường (Benchmark & Telemetry) — Đạt ~45%
* ✅ **Đã hoàn thành:**
  * HUD Performance Telemetry đo thời gian thực: FPS, frame time (ms), WebGL draw calls, triangle count.
  * Modal kiểm thử tự động 5 kịch bản Acceptance Criteria của Gate A (`MAP-01`, `MAP-02`, `ANI-01`, `AST-01`, `MOB-01`).
* ⏳ **Kế hoạch Phase 1:**
  * Thực hiện benchmark thực tế trên 3 thiết bị vật lý: 1 Android tầm trung, 1 iPhone phổ biến, 1 Desktop.

---

## 3. Điểm Khác Biệt Giữa Phase 0 (Hiện tại) & Phase 1 (Mục tiêu cuối)

| Hạng mục | Trạng thái Phase 0 (Spike khả thi) | Mục tiêu Phase 1 (Sản phẩm PoC) |
|---|---|---|
| **Bản đồ nền** | Raster Tiles (Esri World Street / OSM) không watermark | Vector Tiles tùy biến màu nước, đường sá |
| **Lưu trữ dữ liệu** | File JSON Seed tĩnh cục bộ | PostgreSQL + PostGIS qua REST API |
| **Model 3D** | Low-poly Procedural GLB (188 KB) | Blender Model hoàn thiện từ 3D Artist |
| **AI Engine** | Grounded Rule/Tool Orchestration cục bộ | Cloud LLM (Gemini/OpenAI) + Streaming |

---

## 4. Lộ trình Triển khai Phase 1 (Dự kiến 6 tuần)

* **Tuần 1:** Khởi tạo Backend REST API (Fastify/Node.js) & Dựng Database PostgreSQL/PostGIS, chuyển đổi 17 POI sang bảng không gian.
* **Tuần 2:** Tích hợp mô hình 3D Blender chính thức từ 3D Designer vào hệ thống manifest.
* **Tuần 3:** Hoàn thiện Guided Tour Sequence với GSAP Timeline và âm thanh thuyết minh (nếu có).
* **Tuần 4:** Đấu nối API Cloud LLM thật (Google Gemini API) với Function Calling và trích dẫn nguồn.
* **Tuần 5:** Tối ưu hóa hiệu năng mobile chuyên sâu: texture compression (KTX2), LOD và viewport culling.
* **Tuần 6:** Đo lường trên thiết bị thật, lập báo cáo benchmark kỹ thuật và nghiệm thu PoC.
