import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function History() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/chat/conversations");
      setConvs(data || []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Delete this consultation?")) return;
    try {
      await api.delete(`/chat/conversations/${id}`);
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-[#5C6A64] mb-3">Your archive</div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#1A2E25]">{t("history")}</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#5C6A64]">Loading...</div>
        ) : convs.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#E1DFDA] rounded-3xl">
            <p className="text-[#5C6A64]">{t("chatHistoryEmpty")}</p>
            <Button onClick={() => nav("/chat")} className="mt-6 rounded-full btn-sage" data-testid="history-start">
              {t("getStarted")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {convs.map((c) => (
              <div key={c.id}
                className="bg-white border border-[#E1DFDA] rounded-2xl p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
                onClick={() => nav(`/chat/${c.id}`)}
                data-testid={`history-${c.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#8BA888]/12 text-[#8BA888] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1A2E25] truncate font-medium">{c.title}</div>
                  <div className="text-xs text-[#5C6A64] mt-1">
                    {c.message_count || 0} messages • {c.model} • {c.language?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); del(c.id); }}
                  className="text-[#CC7A6B] p-2 rounded-full hover:bg-[#CC7A6B]/10"
                  data-testid={`history-del-${c.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
