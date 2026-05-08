import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import api, { formatApiError } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

export default function Profile() {
  const { t } = useI18n();
  const [profile, setProfile] = useState({
    age: "", sex: "", height_cm: "", weight_kg: "", blood_type: "",
    allergies: "", chronic_conditions: "", current_medications: "",
    family_history: "", smoking: "", alcohol: "", notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/profile/health");
        if (data) {
          setProfile({
            age: data.age ?? "",
            sex: data.sex || "",
            height_cm: data.height_cm ?? "",
            weight_kg: data.weight_kg ?? "",
            blood_type: data.blood_type || "",
            allergies: (data.allergies || []).join(", "),
            chronic_conditions: (data.chronic_conditions || []).join(", "),
            current_medications: (data.current_medications || []).join(", "),
            family_history: (data.family_history || []).join(", "),
            smoking: data.smoking || "",
            alcohol: data.alcohol || "",
            notes: data.notes || "",
          });
        }
      } catch (e) {
        toast.error(formatApiError(e.response?.data?.detail));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const csv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        age: profile.age ? Number(profile.age) : null,
        sex: profile.sex || null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        blood_type: profile.blood_type || null,
        allergies: csv(profile.allergies),
        chronic_conditions: csv(profile.chronic_conditions),
        current_medications: csv(profile.current_medications),
        family_history: csv(profile.family_history),
        smoking: profile.smoking || null,
        alcohol: profile.alcohol || null,
        notes: profile.notes || null,
      };
      await api.put("/profile/health", payload);
      toast.success(t("saved"));
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <Navbar />
        <div className="max-w-3xl mx-auto py-20 text-center text-[#5C6A64]">Loading...</div>
      </div>
    );
  }

  const F = ({ label, ...props }) => (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{label}</Label>
      <Input className="rounded-xl h-12 border-[#E1DFDA] bg-[#F9F8F6]" {...props} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-[#5C6A64] mb-3">Personal medicine</div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#1A2E25] mb-4">{t("healthProfile")}</h1>
          <p className="text-[#5C6A64] max-w-2xl">{t("healthProfileDesc")}</p>
        </div>

        <div className="bg-white border border-[#E1DFDA] rounded-3xl p-6 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <F label={t("age")} type="number" min="0" max="120"
               value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })}
               data-testid="profile-age" />
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{t("sex")}</Label>
              <Select value={profile.sex || undefined} onValueChange={(v) => setProfile({ ...profile, sex: v })}>
                <SelectTrigger className="rounded-xl h-12 border-[#E1DFDA] bg-[#F9F8F6]" data-testid="profile-sex">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <F label={t("bloodType")} placeholder="A+, O-, ..."
               value={profile.blood_type} onChange={(e) => setProfile({ ...profile, blood_type: e.target.value })}
               data-testid="profile-blood" />
            <F label={t("height")} type="number"
               value={profile.height_cm} onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
               data-testid="profile-height" />
            <F label={t("weight")} type="number"
               value={profile.weight_kg} onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
               data-testid="profile-weight" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <F label={`${t("allergies")} (${t("commaSeparated")})`} value={profile.allergies}
               onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} data-testid="profile-allergies" />
            <F label={`${t("chronicConditions")} (${t("commaSeparated")})`} value={profile.chronic_conditions}
               onChange={(e) => setProfile({ ...profile, chronic_conditions: e.target.value })} data-testid="profile-conditions" />
            <F label={`${t("medications")} (${t("commaSeparated")})`} value={profile.current_medications}
               onChange={(e) => setProfile({ ...profile, current_medications: e.target.value })} data-testid="profile-meds" />
            <F label={`${t("familyHistory")} (${t("commaSeparated")})`} value={profile.family_history}
               onChange={(e) => setProfile({ ...profile, family_history: e.target.value })} data-testid="profile-family" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{t("smoking")}</Label>
              <Select value={profile.smoking || undefined} onValueChange={(v) => setProfile({ ...profile, smoking: v })}>
                <SelectTrigger className="rounded-xl h-12 border-[#E1DFDA] bg-[#F9F8F6]" data-testid="profile-smoking">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="former">Former</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{t("alcohol")}</Label>
              <Select value={profile.alcohol || undefined} onValueChange={(v) => setProfile({ ...profile, alcohol: v })}>
                <SelectTrigger className="rounded-xl h-12 border-[#E1DFDA] bg-[#F9F8F6]" data-testid="profile-alcohol">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="occasional">Occasional</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.2em] text-[#5C6A64]">{t("notes")}</Label>
            <Textarea rows={4} value={profile.notes}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              className="rounded-xl border-[#E1DFDA] bg-[#F9F8F6]" data-testid="profile-notes" />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={save} disabled={saving} className="rounded-full btn-sage h-12 px-10" data-testid="profile-save">
              {saving ? "..." : t("save")}
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <MedicalDisclaimer />
        </div>
      </div>
    </div>
  );
}
