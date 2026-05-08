import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function MedicalDisclaimer({ compact = false }) {
  const { t } = useI18n();
  if (compact) {
    return (
      <p className="text-xs text-[#5C6A64] flex items-start gap-1.5" data-testid="disclaimer-compact">
        <AlertTriangle className="w-3 h-3 mt-0.5 text-[#CC7A6B]" />
        <span>{t("disclaimer")}</span>
      </p>
    );
  }
  return (
    <div className="rounded-2xl bg-[#CC7A6B]/8 border border-[#CC7A6B]/20 p-4 flex items-start gap-3" data-testid="disclaimer">
      <AlertTriangle className="w-5 h-5 text-[#CC7A6B] mt-0.5 shrink-0" />
      <p className="text-sm text-[#1A2E25] leading-relaxed">{t("disclaimer")}</p>
    </div>
  );
}
