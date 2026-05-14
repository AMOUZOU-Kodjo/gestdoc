import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Upload,
  Shield,
  AlertTriangle,
  Save,
  RefreshCw,
  Download,
  Upload as UploadIcon,
  Heart,
  DollarSign,
  Smartphone,
  User,
  Tag,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { adminApi } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPreview, setShowPreview] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: () => adminApi.getSettings().then((r) => r.data),
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: (res) => {
      qc.setQueryData(["adminSettings"], res.data);
      toast.success("✅ Paramètres sauvegardés !");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Erreur lors de la sauvegarde"),
  });

  const handleSave = () => {
    if (!form) return;
    
    // Validation des URLs
    const urlFields = ["facebookUrl", "twitterUrl", "instagramUrl", "youtubeUrl"];
    for (const field of urlFields) {
      const value = form[field];
      if (value && !value.startsWith("http")) {
        toast.error(`L'URL ${field} doit commencer par http:// ou https://`);
        return;
      }
    }
    
    // Validation email
    if (form.contactEmail && !form.contactEmail.includes("@")) {
      toast.error("Email de contact invalide");
      return;
    }
    
    mutation.mutate(form);
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleExport = () => {
    const dataStr = JSON.stringify(form, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestdoc_settings_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Paramètres exportés");
  };

  const tabs = [
    { id: "general", label: "Général", icon: <Globe size={15} /> },
    { id: "contact", label: "Contact", icon: <Mail size={15} /> },
    { id: "social", label: "Réseaux", icon: <Facebook size={15} /> },
    { id: "donations", label: "Dons", icon: <Heart size={15} /> },
    { id: "security", label: "Sécurité", icon: <Shield size={15} /> },
  ];

  // Prévisualisation du footer
  const FooterPreview = () => (
    <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
      <div className="bg-base-200 px-4 py-2 border-b border-base-200">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-primary" />
          <span className="text-xs font-semibold">Aperçu du footer</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {form?.facebookUrl && (
            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
              <Facebook size={14} className="text-blue-600" />
            </div>
          )}
          {form?.twitterUrl && (
            <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center">
              <Twitter size={14} className="text-sky-500" />
            </div>
          )}
          {form?.instagramUrl && (
            <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Instagram size={14} className="text-pink-500" />
            </div>
          )}
          {form?.youtubeUrl && (
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <Youtube size={14} className="text-red-500" />
            </div>
          )}
          {!form?.facebookUrl && !form?.twitterUrl && !form?.instagramUrl && !form?.youtubeUrl && (
            <p className="text-xs text-base-content/40">Aucun réseau social configuré</p>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold">{form?.siteName || "GestDoc"}</p>
          <p className="text-[10px] text-base-content/40">© {new Date().getFullYear()} - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );

  if (isLoading || !form)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="btn btn-ghost btn-sm btn-square">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings size={20} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold">Paramètres du site</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn btn-ghost btn-sm gap-2">
              <Download size={14} /> Export
            </button>
            <button
              onClick={handleSave}
              disabled={mutation.isPending}
              className="btn btn-primary btn-sm gap-2"
            >
              {mutation.isPending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Save size={15} />
              )}
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`tab gap-2 flex-1 text-sm transition-all ${
                activeTab === t.id ? "tab-active" : ""
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6 space-y-5">
            {/* ── Général ─────────────────────────────────────────────── */}
            {activeTab === "general" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <Globe size={18} className="text-primary" /> 
                    Informations générales
                  </h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="btn btn-xs btn-ghost gap-1"
                  >
                    <Eye size={12} />
                    {showPreview ? "Masquer" : "Aperçu"}
                  </button>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Nom du site</span>
                  </label>
                  <input
                    type="text"
                    value={form.siteName || ""}
                    onChange={(e) => set("siteName", e.target.value)}
                    className="input input-bordered w-full"
                    maxLength={100}
                    placeholder="GestDoc"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Description du site</span>
                  </label>
                  <textarea
                    value={form.siteDescription || ""}
                    onChange={(e) => set("siteDescription", e.target.value)}
                    className="textarea textarea-bordered w-full h-24 resize-none"
                    maxLength={300}
                    placeholder="Plateforme de partage de documents éducatifs au Togo"
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      Utilisée dans les balises meta SEO
                    </span>
                    <span className="label-text-alt">
                      {(form.siteDescription || "").length}/300
                    </span>
                  </label>
                </div>

                {showPreview && (
                  <div className="bg-base-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                      Aperçu
                    </p>
                    <div className="bg-base-100 rounded-lg p-3">
                      <p className="text-sm font-semibold">{form.siteName || "GestDoc"}</p>
                      <p className="text-xs text-base-content/60 mt-1">
                        {form.siteDescription || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Contact ─────────────────────────────────────────────── */}
            {activeTab === "contact" && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Mail size={18} className="text-primary" /> 
                  Informations de contact
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Mail size={14} /> Email de contact
                      </span>
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail || ""}
                      placeholder="contact@gestdoc.tg"
                      onChange={(e) => set("contactEmail", e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Phone size={14} /> Téléphone
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={form.contactPhone || ""}
                      placeholder="+228 70 85 59 01"
                      onChange={(e) => set("contactPhone", e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <MapPin size={14} /> Adresse
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.contactAddress || ""}
                      placeholder="Lomé, Togo"
                      onChange={(e) => set("contactAddress", e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Réseaux sociaux ──────────────────────────────────────── */}
            {activeTab === "social" && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Facebook size={18} className="text-primary" /> 
                  Réseaux sociaux
                </h2>
                <p className="text-sm text-base-content/60">
                  Entrez l'URL complète ou laissez vide pour masquer l'icône dans le footer.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: "Facebook", key: "facebookUrl", icon: <Facebook size={16} className="text-blue-600" />, placeholder: "https://facebook.com/votrepage" },
                    { label: "Twitter/X", key: "twitterUrl", icon: <Twitter size={16} className="text-sky-500" />, placeholder: "https://twitter.com/votrecompte" },
                    { label: "Instagram", key: "instagramUrl", icon: <Instagram size={16} className="text-pink-500" />, placeholder: "https://instagram.com/votrecompte" },
                    { label: "YouTube", key: "youtubeUrl", icon: <Youtube size={16} className="text-red-500" />, placeholder: "https://youtube.com/@votrechaine" },
                  ].map((f) => (
                    <div key={f.key} className="form-control">
                      <label className="label">
                        <span className="label-text font-medium flex items-center gap-2">
                          {f.icon}
                          {f.label}
                        </span>
                      </label>
                      <input
                        type="url"
                        value={form[f.key] || ""}
                        placeholder={f.placeholder}
                        onChange={(e) => set(f.key, e.target.value)}
                        className="input input-bordered w-full"
                      />
                      {form[f.key] && (
                        <label className="label">
                          <span className="label-text-alt text-success flex items-center gap-1">
                            <CheckCircle size={10} /> URL configurée
                          </span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                <FooterPreview />
              </>
            )}

            {/* ── Dons (T-Money/Orange Money) ─────────────────────────── */}
            {activeTab === "donations" && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Heart size={18} className="text-primary" /> 
                  Configuration des dons
                </h2>
                <p className="text-sm text-base-content/60">
                  Configurez les informations de collecte de dons via T-Money et Orange Money.
                </p>

                <div className="space-y-4">
                  {/* Activer les dons */}
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-start gap-3">
                      <Heart size={20} className="text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Activer la section dons</p>
                        <p className="text-xs text-base-content/60 mt-0.5">
                          Affiche la bannière de dons sur la page d'accueil et le footer.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!form.donActif}
                      onChange={(e) => set("donActif", e.target.checked)}
                      className="toggle toggle-primary"
                    />
                  </div>

                  {form.donActif && (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium flex items-center gap-2">
                            <Tag size={14} /> Titre de la section
                          </span>
                        </label>
                        <input
                          type="text"
                          value={form.donTitre || ""}
                          placeholder="Soutenez GestDoc"
                          onChange={(e) => set("donTitre", e.target.value)}
                          className="input input-bordered w-full"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium flex items-center gap-2">
                            <MessageSquare size={14} /> Message de motivation
                          </span>
                        </label>
                        <textarea
                          value={form.donMessage || ""}
                          placeholder="Votre soutien nous aide à maintenir la plateforme et à ajouter de nouveaux contenus..."
                          onChange={(e) => set("donMessage", e.target.value)}
                          className="textarea textarea-bordered w-full h-24 resize-none"
                          maxLength={500}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium flex items-center gap-2">
                              <User size={14} /> Nom du bénéficiaire
                            </span>
                          </label>
                          <input
                            type="text"
                            value={form.donNom || ""}
                            placeholder="John DOE"
                            onChange={(e) => set("donNom", e.target.value)}
                            className="input input-bordered w-full"
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium flex items-center gap-2">
                              <Smartphone size={14} /> Numéro T-Money/Orange Money
                            </span>
                          </label>
                          <input
                            type="tel"
                            value={form.donNumero || ""}
                            placeholder="70 85 59 01"
                            onChange={(e) => set("donNumero", e.target.value)}
                            className="input input-bordered w-full"
                          />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium flex items-center gap-2">
                            <DollarSign size={14} /> Montants suggérés
                          </span>
                          <span className="label-text-alt text-base-content/50">
                            Séparés par des virgules
                          </span>
                        </label>
                        <input
                          type="text"
                          value={form.donMontants || ""}
                          placeholder="500, 1000, 2000, 5000"
                          onChange={(e) => set("donMontants", e.target.value)}
                          className="input input-bordered w-full"
                        />
                        <label className="label">
                          <span className="label-text-alt text-base-content/50">
                            Exemple: 500, 1000, 2000, 5000 (en FCFA)
                          </span>
                        </label>
                      </div>

                      {/* Aperçu des dons */}
                      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">
                          Aperçu de la bannière de dons
                        </p>
                        <div className="bg-base-100 rounded-lg p-4 text-center space-y-2">
                          <Heart className="mx-auto text-primary" size={24} />
                          <p className="font-semibold">{form.donTitre || "Soutenez GestDoc"}</p>
                          <p className="text-xs text-base-content/60">
                            {form.donMessage || "Votre soutien nous aide à maintenir la plateforme"}
                          </p>
                          <div className="flex justify-center gap-2 mt-2">
                            {form.donMontants?.split(",").map((m, i) => (
                              <span key={i} className="badge badge-primary badge-sm">
                                {m.trim()} FCFA
                              </span>
                            ))}
                          </div>
                          <div className="text-xs font-mono text-primary">
                            {form.donNom || "Bénéficiaire"} • {form.donNumero || "XX XX XX XX"}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── Sécurité & Fonctionnalités ───────────────────────────── */}
            {activeTab === "security" && (
              <>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Shield size={18} className="text-primary" /> 
                  Sécurité & Fonctionnalités
                </h2>

                {/* Mode maintenance */}
                <div
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    form.maintenanceMode ? "border-error bg-error/5" : "border-base-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className={form.maintenanceMode ? "text-error mt-0.5" : "text-base-content/40 mt-0.5"} />
                    <div>
                      <p className="font-medium text-sm">Mode maintenance</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Affiche une page de maintenance aux visiteurs. Seuls les admins peuvent accéder.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!form.maintenanceMode}
                    onChange={(e) => set("maintenanceMode", e.target.checked)}
                    className="toggle toggle-error"
                  />
                </div>

                {/* Autoriser les uploads */}
                <div
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    !form.allowUploads ? "border-warning bg-warning/5" : "border-base-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Upload size={20} className={!form.allowUploads ? "text-warning mt-0.5" : "text-base-content/40 mt-0.5"} />
                    <div>
                      <p className="font-medium text-sm">Autoriser les uploads</p>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Permettre aux utilisateurs de soumettre de nouveaux documents.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!form.allowUploads}
                    onChange={(e) => set("allowUploads", e.target.checked)}
                    className="toggle toggle-success"
                  />
                </div>

                {/* Taille max fichier */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Taille maximale des fichiers</span>
                    <span className="label-text-alt font-semibold text-primary">
                      {form.maxFileSizeMb || 20} Mo
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={form.maxFileSizeMb || 20}
                    onChange={(e) => set("maxFileSizeMb", parseInt(e.target.value))}
                    className="range range-primary range-sm"
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-base-content/50 mt-1 px-1">
                    <span>1 Mo</span>
                    <span>25 Mo</span>
                    <span>50 Mo</span>
                    <span>100 Mo</span>
                  </div>
                </div>

                {/* Résumé */}
                <div className="bg-base-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
                    Résumé de la configuration
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${form.maintenanceMode ? "bg-error" : "bg-success"}`}></div>
                      {form.maintenanceMode ? "🔧 Site en maintenance" : "🌐 Site en ligne"}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${form.allowUploads ? "bg-success" : "bg-warning"}`}></div>
                      {form.allowUploads ? "📤 Uploads activés" : "⏸️ Uploads désactivés"}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-info"></div>
                      📦 Taille max : {form.maxFileSizeMb || 20} Mo
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bouton flottant de sauvegarde */}
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            {mutation.isPending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save size={16} />
            )}
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}