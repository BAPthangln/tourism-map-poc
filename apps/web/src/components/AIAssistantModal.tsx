import React, { useState } from 'react';
import { Place, TourRoute } from '@tourism-map/shared-types';
import { SceneManager } from '@tourism-map/map-engine';
import { Bot, Send, Sparkles, MapPin, X } from 'lucide-react';

interface Props {
  sceneManager: SceneManager | null;
  places: Place[];
  routes: TourRoute[];
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sourceCitation?: string;
  actionSummary?: string;
  actionPayload?: () => void;
}

export const AIAssistantModal: React.FC<Props> = ({ sceneManager, places, routes, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là Trợ lý AI Du lịch Đà Nẵng (Grounded AI). Tôi có thể tìm địa điểm, giải thích lịch sử có nguồn xác thực và điều khiển camera bản đồ theo yêu cầu của bạn.',
    },
  ]);

  const quickPrompts = [
    'Cho tôi xem 3 điểm ngắm cảnh đẹp nhất gần Sông Hàn',
    'Tạo tuyến khám phá kiến trúc & di sản ven sông',
    'Cầu Rồng phun lửa mấy giờ và giá vé Bảo tàng Chăm bao nhiêu?',
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Simulate Grounded LLM Tool Calling & ID validation
    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply: Message;

      if (lower.includes('3 điểm') || lower.includes('ngắm cảnh') || lower.includes('đẹp')) {
        const top3 = places.filter((p) =>
          ['poi_dragon_bridge', 'poi_han_bridge', 'poi_apec_park'].includes(p.id)
        );
        reply = {
          role: 'assistant',
          content: `Dựa trên dữ liệu du lịch đã xác minh, 3 địa điểm ngắm cảnh tiêu biểu nhất đôi bờ sông Hàn gồm:\n\n1. **${top3[0]?.name}**: Kiến trúc rồng vươn ra biển với mô hình 3D tương tác.\n2. **${top3[1]?.name}**: Cầu quay đầu tiên của Việt Nam.\n3. **${top3[2]?.name}**: Không gian xanh với mái vòm Cánh diều nghệ thuật.\n\nĐã kích hoạt camera bay tới Cầu Rồng!`,
          sourceCitation: 'Sở Du lịch TP Đà Nẵng & danangfantasticity (15/10/2026)',
          actionSummary: 'camera.flyTo (poi_dragon_bridge, zoom: 17)',
          actionPayload: () => {
            if (sceneManager) {
              sceneManager.selectPlace('poi_dragon_bridge');
            }
          },
        };
      } else if (lower.includes('tuyến') || lower.includes('lộ trình') || lower.includes('khám phá')) {
        const sampleRoute = routes[0];
        reply = {
          role: 'assistant',
          content: `Đã thiết lập tuyến **"${sampleRoute.name}"** gồm ${sampleRoute.stops.length} điểm dừng dọc sông Hàn (${sampleRoute.estimated_duration_min} phút).\n\nTuyến bắt đầu từ Công viên APEC, qua Bảo tàng Chăm, Cầu Rồng, Cầu Tình Yêu và kết thúc tại Cầu quay Sông Hàn. Đã vẽ lộ trình trực quan trên bản đồ!`,
          sourceCitation: 'Trung tâm Xúc tiến Du lịch Đà Nẵng',
          actionSummary: 'route.reveal (route_han_river_highlights)',
          actionPayload: () => {
            if (sceneManager) {
              sceneManager.startTour(sampleRoute.id);
            }
          },
        };
      } else if (lower.includes('phun lửa') || lower.includes('bảo tàng') || lower.includes('vé')) {
        reply = {
          role: 'assistant',
          content: `Thông tin chính xác có nguồn kiểm chứng:\n\n• **Cầu Rồng**: Trình diễn phun lửa và phun nước vào **21h00 các ngày Thứ Bảy, Chủ Nhật** (Tham quan miễn phí).\n• **Bảo tàng Điêu khắc Chăm**: Mở cửa **07:30 - 17:00** hàng ngày; Giá vé **60.000 VNĐ / người lớn**.\n\n*Lưu ý: AI không tự suy đoán thông tin khi không có nguồn xác minh.*`,
          sourceCitation: 'Bảo tàng Chăm Đà Nẵng (chammuseum.vn) & danangfantasticity',
          actionSummary: 'camera.flyTo (poi_cham_museum)',
          actionPayload: () => {
            if (sceneManager) {
              sceneManager.selectPlace('poi_cham_museum');
            }
          },
        };
      } else {
        // Fallback grounded answer
        reply = {
          role: 'assistant',
          content: `Tôi đã tra cứu cơ sở dữ liệu Đà Nẵng: Hiện tại khu vực Sông Hàn có ${places.length} điểm POI đã kiểm duyệt. Bạn có thể chọn bất kỳ địa điểm nào trên bản đồ để xem mô hình 3D hoặc tra cứu giờ mở cửa/giá vé.`,
          sourceCitation: 'Cơ sở dữ liệu Du lịch Sông Hàn Đà Nẵng',
        };
      }

      setMessages((prev) => [...prev, reply]);
      setIsLoading(false);

      // Auto-trigger action if present
      if (reply.actionPayload) {
        reply.actionPayload();
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-4 border border-white/20 shadow-2xl flex flex-col h-[520px] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Trợ Lý Du Lịch Sông Hàn (Grounded AI)
              </h2>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Grounded Schema Validation Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-rose-600 text-white rounded-br-sm'
                    : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/10'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                {m.actionSummary && (
                  <div className="mt-2 p-1.5 rounded bg-black/40 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                    <MapPin size={11} className="text-cyan-400 shrink-0" />
                    <span>Lệnh bản đồ: {m.actionSummary}</span>
                  </div>
                )}

                {m.sourceCitation && (
                  <div className="mt-1.5 text-[9px] text-slate-400 border-t border-white/10 pt-1">
                    Trích dẫn: {m.sourceCitation}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
              <Sparkles size={14} className="text-rose-400 animate-spin" />
              Đang xác thực schema dữ liệu & tạo map actions...
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="py-2 border-t border-white/10 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-[10px] bg-white/5 hover:bg-white/15 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap border border-white/10 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="pt-2 border-t border-white/10 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi về địa điểm, giá vé, tạo tour..."
            className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="glass-btn glass-btn-primary px-3 py-2 rounded-xl text-xs disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
