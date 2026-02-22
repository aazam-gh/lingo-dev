import { useState, useEffect, useCallback, useRef } from "react";
import "./index.css";

// ─── Types ───────────────────────────────────────────────────────────
interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category: string;
  subcategory: string;
}

interface TranslationState {
  [itemId: string]: {
    title: string;
    description: string;
  };
}

// ─── Language Options ────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇶🇦" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "zh-Hans", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ur", name: "اردو", flag: "🇵🇰" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "fa", name: "فارسی", flag: "🇮🇷" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "uk-UA", name: "Українська", flag: "🇺🇦" },
];

const CATEGORIES = ["All", "Economy", "Sport", "Qatar", "Miscellaneous"];

// ─── Utility Functions ───────────────────────────────────────────────
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getCategoryBadgeClass(category: string): string {
  switch (category.toLowerCase()) {
    case "economy":
      return "badge-economy";
    case "sport":
      return "badge-sport";
    case "qatar":
      return "badge-qatar";
    default:
      return "badge-miscellaneous";
  }
}

function getCategoryIcon(category: string): string {
  switch (category.toLowerCase()) {
    case "economy":
      return "trending_up";
    case "sport":
      return "sports_soccer";
    case "qatar":
      return "location_city";
    default:
      return "public";
  }
}

// ─── Header Component ────────────────────────────────────────────────
function Header({
  selectedLanguage,
  onLanguageChange,
  isTranslating,
  feedCount,
}: {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  isTranslating: boolean;
  feedCount: number;
}) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background-dark/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center">
              <span
                className="material-symbols-outlined text-background-dark"
                style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
              >
                rss_feed
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-text-main font-bold text-base leading-tight tracking-tight">
                QNA <span className="gradient-text">Aggregator</span>
              </h1>
              <span className="text-text-dim text-[10px] font-mono uppercase tracking-widest">
                Qatar News Agency
              </span>
            </div>
          </div>

          {/* Center - Live indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-subtle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
            </span>
            <span className="text-text-muted text-xs font-mono">
              {feedCount} articles live
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border-subtle hover:border-border-hover transition-all duration-200 group"
              >
                <span className="text-base">{currentLang?.flag}</span>
                <span className="text-text-secondary text-sm font-medium hidden sm:block">
                  {currentLang?.name}
                </span>
                {isTranslating ? (
                  <span className="material-symbols-outlined text-primary text-sm animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-text-muted text-sm group-hover:text-text-secondary transition-colors">
                    expand_more
                  </span>
                )}
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-highlight border border-border-subtle rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in z-50">
                  <div className="p-2 border-b border-border-subtle">
                    <p className="text-text-muted text-[10px] font-mono uppercase tracking-widest px-2 py-1">
                      Translate via Lingo.dev
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-hover transition-colors ${selectedLanguage === lang.code
                            ? "text-primary bg-primary-glow"
                            : "text-text-secondary"
                          }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        {selectedLanguage === lang.code && (
                          <span className="material-symbols-outlined text-primary text-sm ml-auto">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Category Filter Bar ─────────────────────────────────────────────
function CategoryBar({
  activeCategory,
  onCategoryChange,
  categoryCounts,
}: {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categoryCounts: Record<string, number>;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat;
        const count =
          cat === "All"
            ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
            : categoryCounts[cat] || 0;
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-surface text-text-muted border border-border-subtle hover:border-border-hover hover:text-text-secondary"
              }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
            >
              {cat === "All"
                ? "grid_view"
                : getCategoryIcon(cat)}
            </span>
            {cat}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-highlight text-text-dim"
                }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── News Card Component ─────────────────────────────────────────────
function NewsCard({
  item,
  translation,
  index,
  isTranslated,
}: {
  item: FeedItem;
  translation?: { title: string; description: string };
  index: number;
  isTranslated: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const displayTitle = isTranslated && translation ? translation.title : item.title;
  const displayDescription = isTranslated && translation ? translation.description : item.description;

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`animate-fade-in-up stagger-${Math.min(index % 8, 8) + 1}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article
        className={`glass-card rounded-xl overflow-hidden transition-all duration-300 h-full flex flex-col ${isHovered ? "shadow-lg shadow-black/30 -translate-y-0.5" : ""
          }`}
      >
        {/* Category color accent */}
        <div
          className={`h-0.5 w-full ${item.category === "Economy"
              ? "bg-gradient-to-r from-primary/60 to-primary"
              : item.category === "Sport"
                ? "bg-gradient-to-r from-emerald-dim to-emerald"
                : item.category === "Qatar"
                  ? "bg-gradient-to-r from-qatar-maroon-dim to-qatar-maroon"
                  : "bg-gradient-to-r from-blue-accent/60 to-blue-accent"
            }`}
        />

        <div className="p-5 flex flex-col flex-1">
          {/* Top row: Category badge + Time */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${getCategoryBadgeClass(
                  item.category
                )}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "12px" }}
                >
                  {getCategoryIcon(item.category)}
                </span>
                {item.category}
              </span>
              <span className="text-text-dim text-[10px] font-mono px-2 py-0.5 rounded bg-surface-highlight">
                {item.subcategory}
              </span>
            </div>
            <div className="flex items-center gap-1 text-text-dim">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "12px" }}
              >
                schedule
              </span>
              <span className="text-[10px] font-mono">
                {timeAgo(item.pubDate)}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3
            className={`font-display font-semibold text-[17px] leading-snug mb-3 line-clamp-2 transition-colors duration-200 ${isHovered ? "text-primary" : "text-text-main"
              }`}
          >
            {displayTitle}
          </h3>

          {/* Description */}
          <p className="text-text-muted text-[13px] leading-relaxed line-clamp-3 mb-4 flex-1">
            {displayDescription}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle/60">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-text-dim text-[10px] font-mono">
                QNA • {new Date(item.pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-primary transition-all duration-200 ${isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-1"
                }`}
              style={{ fontSize: "16px" }}
            >
              arrow_outward
            </span>
          </div>

          {/* Translation indicator */}
          {isTranslated && translation && (
            <div className="mt-2 flex items-center gap-1.5 text-primary/60">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "12px" }}
              >
                translate
              </span>
              <span className="text-[10px] font-mono">Translated by Lingo.dev</span>
            </div>
          )}
        </div>
      </article>
    </a>
  );
}

// ─── Skeleton Card ───────────────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className={`glass-card rounded-xl overflow-hidden animate-fade-in-up stagger-${(index % 8) + 1
        }`}
    >
      <div className="h-0.5 w-full animate-shimmer" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-20 rounded-md animate-shimmer" />
          <div className="h-4 w-12 rounded animate-shimmer" />
        </div>
        <div className="h-5 w-full rounded animate-shimmer mb-2" />
        <div className="h-5 w-3/4 rounded animate-shimmer mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full rounded animate-shimmer" />
          <div className="h-3 w-full rounded animate-shimmer" />
          <div className="h-3 w-2/3 rounded animate-shimmer" />
        </div>
        <div className="pt-3 border-t border-border-subtle/60">
          <div className="h-3 w-24 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ─── Translation Banner ──────────────────────────────────────────────
function TranslationBanner({
  language,
  isTranslating,
  onClear,
}: {
  language: string;
  isTranslating: boolean;
  onClear: () => void;
}) {
  const lang = LANGUAGES.find((l) => l.code === language);
  if (!lang || language === "en") return null;

  return (
    <div className="animate-slide-in-right flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/8 border border-primary/20">
      <span className="material-symbols-outlined text-primary" style={{ fontSize: "18px" }}>
        translate
      </span>
      <div className="flex-1">
        <span className="text-text-secondary text-sm">
          {isTranslating ? (
            <>
              Translating to{" "}
              <strong className="text-primary">{lang.flag} {lang.name}</strong>
              <span className="ml-1.5 inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0s" }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
              </span>
            </>
          ) : (
            <>
              Showing translations in{" "}
              <strong className="text-primary">{lang.flag} {lang.name}</strong>
              <span className="text-text-dim text-[10px] ml-2 font-mono">via Lingo.dev SDK</span>
            </>
          )}
        </span>
      </div>
      <button
        onClick={onClear}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface transition-colors text-xs"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
        Clear
      </button>
    </div>
  );
}

// ─── Search Bar ──────────────────────────────────────────────────────
function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span
          className="material-symbols-outlined text-text-dim group-focus-within:text-primary transition-colors"
          style={{ fontSize: "18px" }}
        >
          search
        </span>
      </div>
      <input
        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border-subtle text-text-main text-sm placeholder-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        placeholder="Search articles..."
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-dim hover:text-text-secondary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
        </button>
      )}
    </div>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────
function StatsBar({ items }: { items: FeedItem[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = items.filter((i) => new Date(i.pubDate) >= today).length;
  const categories = new Set(items.map((i) => i.category)).size;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {[
        { icon: "article", label: "Total Articles", value: items.length },
        { icon: "today", label: "Today", value: todayCount },
        { icon: "category", label: "Categories", value: categories },
        { icon: "language", label: "Languages", value: LANGUAGES.length },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border-subtle"
        >
          <span
            className="material-symbols-outlined text-text-dim"
            style={{ fontSize: "14px" }}
          >
            {stat.icon}
          </span>
          <span className="text-text-main text-sm font-semibold font-mono">
            {stat.value}
          </span>
          <span className="text-text-dim text-[10px] uppercase tracking-wider hidden sm:block">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
function App() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [translations, setTranslations] = useState<TranslationState>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLanguage, setTranslatedLanguage] = useState<string | null>(null);

  // Fetch RSS feeds
  const fetchFeeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/feeds");
      if (!response.ok) throw new Error("Failed to fetch feeds");
      const data = await response.json();
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchFeeds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFeeds]);

  // Handle language change and translate
  const handleLanguageChange = useCallback(
    async (langCode: string) => {
      setSelectedLanguage(langCode);

      if (langCode === "en") {
        setTranslations({});
        setTranslatedLanguage(null);
        return;
      }

      if (items.length === 0) return;

      setIsTranslating(true);

      try {
        // Build texts object for translation (batch all items)
        const textsToTranslate: Record<string, string> = {};
        items.forEach((item) => {
          textsToTranslate[`${item.id}_title`] = item.title;
          textsToTranslate[`${item.id}_desc`] = item.description;
        });

        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLocale: langCode,
            sourceLocale: "en",
          }),
        });

        if (!response.ok) throw new Error("Translation failed");
        const data = await response.json();

        // Map translated text back to items
        const newTranslations: TranslationState = {};
        items.forEach((item) => {
          newTranslations[item.id] = {
            title: data.translated[`${item.id}_title`] || item.title,
            description: data.translated[`${item.id}_desc`] || item.description,
          };
        });

        setTranslations(newTranslations);
        setTranslatedLanguage(langCode);
      } catch (err) {
        console.error("Translation failed:", err);
        setError("Translation failed. Please try again.");
      } finally {
        setIsTranslating(false);
      }
    },
    [items]
  );

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Category counts
  const categoryCounts: Record<string, number> = {};
  items.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  const isTranslated = translatedLanguage !== null && translatedLanguage !== "en";

  return (
    <div className="min-h-screen bg-background-dark noise-overlay">
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        isTranslating={isTranslating}
        feedCount={items.length}
      />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-main mb-2">
                News <span className="gradient-text">Intelligence</span>
              </h2>
              <p className="text-text-muted text-sm">
                Aggregated feeds from Qatar News Agency • Updated{" "}
                <span className="text-text-secondary font-mono text-xs">
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Qatar",
                  })}{" "}
                  Doha Time
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchFeeds}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-hover transition-all text-sm disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined ${loading ? "animate-spin" : ""
                    }`}
                  style={{ fontSize: "16px" }}
                >
                  refresh
                </span>
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          {!loading && <StatsBar items={items} />}
        </div>

        {/* Translation Banner */}
        {(isTranslated || isTranslating) && (
          <div className="mb-6">
            <TranslationBanner
              language={selectedLanguage}
              isTranslating={isTranslating}
              onClear={() => handleLanguageChange("en")}
            />
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 overflow-x-auto">
            <CategoryBar
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              categoryCounts={categoryCounts}
            />
          </div>
          <div className="w-full sm:w-64">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-accent/10 border border-red-accent/20 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-red-accent" style={{ fontSize: "20px" }}>
              error
            </span>
            <span className="text-red-accent text-sm flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-accent/60 hover:text-red-accent transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-text-dim" style={{ fontSize: "32px" }}>
                search_off
              </span>
            </div>
            <h3 className="text-text-main font-display text-xl mb-2">No articles found</h3>
            <p className="text-text-muted text-sm max-w-md">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : "There are no articles in this category."}
            </p>
          </div>
        )}

        {/* News Grid */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredItems.map((item, index) => (
              <NewsCard
                key={item.id}
                item={item}
                translation={translations[item.id]}
                index={index}
                isTranslated={isTranslated}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pb-8 border-t border-border-subtle/50 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}
                >
                  rss_feed
                </span>
              </div>
              <span className="text-text-dim text-xs">
                QNA News Aggregator • Powered by{" "}
                <a href="https://lingo.dev" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors">
                  Lingo.dev
                </a>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-dim text-[10px] font-mono uppercase tracking-widest">
                Data source: Qatar News Agency (QNA)
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
