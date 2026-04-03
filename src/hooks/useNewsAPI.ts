import { useEffect, useState } from "react";

const API_KEY = "pub_f0b7fbdedf0f4f96ab20ca7d5e5af130";
const BASE_URL = "https://newsdata.io/api/1/latest";

interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string | null;
  source_name: string;
  pubDate: string;
  category: string[];
}

export interface LiveNewsItem {
  id: string;
  title: string;
  src: string;
  sum: string;
  time: string;
  cat: string;
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapCategory(cats: string[]): string {
  const joined = cats.join(" ").toLowerCase();
  if (joined.includes("health")) return "health";
  if (joined.includes("environment") || joined.includes("weather")) return "weather";
  if (joined.includes("crime") || joined.includes("police")) return "accident";
  if (joined.includes("politics") || joined.includes("business")) return "road";
  return "official";
}

export function useNewsAPI(query = "India disaster OR accident OR emergency OR weather") {
  const [articles, setArticles] = useState<LiveNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const url = `${BASE_URL}?apikey=${API_KEY}&q=${encodeURIComponent(query)}&country=in&language=en&size=10`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("News API error");
        const data = await res.json();
        if (!cancelled && data.results) {
          setArticles(
            data.results
              .filter((a: NewsDataArticle) => a.title)
              .map((a: NewsDataArticle) => ({
                id: a.article_id,
                title: a.title,
                src: a.source_name || "News Source",
                sum: a.description || a.title,
                time: a.pubDate ? timeSince(a.pubDate) : "Recent",
                cat: mapCategory(a.category || []),
              }))
          );
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNews();
    return () => { cancelled = true; };
  }, [query]);

  return { articles, loading, error };
}
