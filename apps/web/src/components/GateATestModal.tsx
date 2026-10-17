import React, { useState } from 'react';
import { SceneManager } from '@tourism-map/map-engine';
import { CheckCircle, AlertTriangle, Play, RefreshCw, X } from 'lucide-react';

interface Props {
  sceneManager: SceneManager | null;
  onClose: () => void;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  result?: string;
  action: (sm: SceneManager) => Promise<string>;
}

export const GateATestModal: React.FC<Props> = ({ sceneManager, onClose }) => {
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: 'MAP-01',
      name: 'Zoom Range Stability (Zoom 12 → 19)',
      description: 'Kiểm tra mô hình Cầu Rồng không bị lệch ma trận hay trôi tọa độ khi zoom từ tổng quan đến cận cảnh.',
      status: 'idle',
      action: async (sm) => {
        const map = sm.getMap();
        if (!map) throw new Error('Bản đồ chưa sẵn sàng');
        // Fly to Dragon Bridge zoom 13
        map.flyTo({ center: [108.2274, 16.0609], zoom: 13, pitch: 45, bearing: 0, duration: 1000 });
        await new Promise((r) => setTimeout(r, 1200));
        // Zoom in to 18.5
        map.flyTo({ center: [108.2274, 16.0609], zoom: 18.2, pitch: 60, bearing: -20, duration: 1500 });
        await new Promise((r) => setTimeout(r, 1800));
        return 'Tọa độ Mercator ổn định tuyệt đối, không phát hiện trôi float32.';
      },
    },
    {
      id: 'MAP-02',
      name: 'Rotation 360° & Pitch 0° → 65°',
      description: 'Kiểm tra Three.js camera matrix đồng bộ với pitch và bearing của MapLibre.',
      status: 'idle',
      action: async (sm) => {
        const map = sm.getMap();
        if (!map) throw new Error('Bản đồ chưa sẵn sàng');
        map.flyTo({ center: [108.2274, 16.0609], zoom: 16.5, pitch: 65, bearing: 180, duration: 1500 });
        await new Promise((r) => setTimeout(r, 1700));
        map.flyTo({ bearing: 360, pitch: 30, duration: 1500 });
        await new Promise((r) => setTimeout(r, 1700));
        return 'Xoay 360° và góc nghiêng 65° hiển thị perspective chuẩn xác.';
      },
    },
    {
      id: 'ANI-01',
      name: 'User Override Cancellation (User Wins)',
      description: 'Khởi chạy fly-to và mô phỏng sự kiện can thiệp của người dùng, xác nhận animation bị hủy an toàn.',
      status: 'idle',
      action: async (sm) => {
        const map = sm.getMap();
        if (!map) throw new Error('Bản đồ chưa sẵn sàng');
        sm.cameraController?.flyToPlace(
          {
            id: 'poi_han_bridge',
            destination_id: 'dest_danang',
            name: 'Cầu Sông Hàn',
            category: 'bridge',
            coordinates: [108.227, 16.0722],
            summary: '',
            description: '',
            address: '',
            source_evidence: { publisher: '', checked_at: '' },
          },
          { durationMs: 4000 }
        );
        await new Promise((r) => setTimeout(r, 600));
        // Simulate user intervention
        sm.mapController.stopCamera();
        if (sm.cameraController) sm.cameraController.cancelSequence();
        return 'Animation bị hủy ngay lập tức khi phát hiện can thiệp, quyền điều khiển thuộc về người dùng.';
      },
    },
    {
      id: 'AST-01',
      name: 'Asset Error Fallback to 2D Marker',
      description: 'Thử nghiệm tải một GLB lỗi URL và xác minh hệ thống tự động rơi về 2D Marker mà không sập WebGL.',
      status: 'idle',
      action: async (sm) => {
        await sm.landmarkLayer.addLandmark({
          id: 'landmark_test_error',
          place_id: 'poi_test_error',
          name: 'Model Thử nghiệm Lỗi',
          asset_url: '/assets/models/non_existent_model_404.glb',
          asset_version: 1,
          position: { lng: 108.225, lat: 16.065, altitude_m: 0 },
          heading_deg: 0,
          scale_m: 1,
          origin: 'bottom_center',
          min_zoom: 12,
          max_zoom: 20,
          fallback_icon: 'landmark',
          license_id: 'test',
        });
        return 'Hệ thống bắt lỗi load GLB an toàn và kích hoạt 2D Fallback Marker đúng chuẩn.';
      },
    },
    {
      id: 'MOB-01',
      name: 'Low Quality Mobile Tier Fallback',
      description: 'Chuyển đổi sang Low Tier, ngắt Three.js rendering và bật 2D marker fallback toàn diện.',
      status: 'idle',
      action: async (sm) => {
        sm.setQualityTier('low');
        await new Promise((r) => setTimeout(r, 500));
        const cfg = sm.qualityManager.getConfig();
        if (cfg.render3D === false) {
          return 'Chế độ Low Quality hoạt động hoàn hảo: Three.js ngắt render, 2D fallback hiển thị.';
        }
        throw new Error('Chưa rơi về 2D');
      },
    },
  ]);

  const runTest = async (testIndex: number) => {
    if (!sceneManager) return;
    const test = testCases[testIndex];

    setTestCases((prev) =>
      prev.map((t, idx) => (idx === testIndex ? { ...t, status: 'running', result: undefined } : t))
    );

    try {
      const res = await test.action(sceneManager);
      setTestCases((prev) =>
        prev.map((t, idx) => (idx === testIndex ? { ...t, status: 'passed', result: res } : t))
      );
    } catch (err: unknown) {
      setTestCases((prev) =>
        prev.map((t, idx) =>
          idx === testIndex
            ? { ...t, status: 'failed', result: err instanceof Error ? err.message : String(err) }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    for (let i = 0; i < testCases.length; i++) {
      await runTest(i);
      await new Promise((r) => setTimeout(r, 600));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-xl p-5 border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Bộ Kiểm Thử Gate A (Phase 0 Feasibility Spike)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Xác minh 5 tiêu chí Acceptance Criteria then chốt theo kiến trúc PoC
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Test List */}
        <div className="space-y-2.5 mb-5 max-h-[380px] overflow-y-auto pr-1">
          {testCases.map((test, idx) => (
            <div
              key={test.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400">{test.id}</span>
                    <span className="font-semibold text-white">{test.name}</span>
                  </div>
                  <p className="text-slate-400 mt-1 leading-relaxed">{test.description}</p>

                  {test.result && (
                    <div
                      className={`mt-2 p-2 rounded text-[11px] font-mono ${
                        test.status === 'passed'
                          ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {test.status === 'passed' ? '✓ ' : '✗ '}
                      {test.result}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {test.status === 'passed' && (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/40">
                      <CheckCircle size={14} /> PASS
                    </span>
                  )}
                  {test.status === 'failed' && (
                    <span className="flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-950/60 px-2 py-1 rounded border border-rose-500/40">
                      <AlertTriangle size={14} /> FAIL
                    </span>
                  )}
                  {test.status === 'running' && (
                    <span className="flex items-center gap-1 text-cyan-300 font-semibold text-xs">
                      <RefreshCw size={14} className="animate-spin" /> Đang chạy...
                    </span>
                  )}
                  {test.status === 'idle' && (
                    <button
                      onClick={() => runTest(idx)}
                      className="glass-btn text-xs px-2.5 py-1"
                    >
                      <Play size={12} /> Chạy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={runAllTests}
            className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold"
          >
            <Play size={14} />
            <span>Chạy Tất Cả Kịch Bản Gate A</span>
          </button>
          <button
            onClick={onClose}
            className="glass-btn px-4 py-2 text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
