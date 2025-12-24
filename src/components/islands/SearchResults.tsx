import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { Search, Loader2 } from 'lucide-react';

export default function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, []);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search across multiple content types
      const [blogPosts, videos, downloads, books, siteContent] = await Promise.all([
        supabaseClient.entities.BlogPost.filter({ title: searchTerm }).catch(() => []),
        supabaseClient.entities.Video.filter({ title: searchTerm }).catch(() => []),
        supabaseClient.entities.Download.filter({ title: searchTerm }).catch(() => []),
        supabaseClient.entities.Book.filter({ title: searchTerm }).catch(() => []),
        supabaseClient.entities.SiteContent.filter({ value: searchTerm }).catch(() => []),
      ]);

      const allResults = [
        ...blogPosts.map((item: any) => ({ ...item, type: 'blog', url: `/resources/blog/${item.slug}` })),
        ...videos.map((item: any) => ({ ...item, type: 'video', url: `/resources/video/${item.id}` })),
        ...downloads.map((item: any) => ({ ...item, type: 'download', url: item.file_url })),
        ...books.map((item: any) => ({ ...item, type: 'book', url: item.purchase_link })),
        ...siteContent.map((item: any) => ({ ...item, type: 'content', url: '/' })),
      ];

      // Simple text matching (in production, use full-text search)
      const filtered = allResults.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.title?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.content?.toLowerCase().includes(searchLower) ||
          item.value?.toLowerCase().includes(searchLower)
        );
      });

      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, videos, resources..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary text-lg"
          />
        </div>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {isSearching ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : hasSearched ? (
        results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-slate-600">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {results.map((item, index) => (
              <a
                key={index}
                href={item.url}
                className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary uppercase">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary mb-2">{item.title || item.value}</h3>
                    {(item.description || item.excerpt) && (
                      <p className="text-slate-600 mb-2">{item.description || item.excerpt}</p>
                    )}
                    <span className="text-sm text-slate-500">{item.type}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-slate-600 mb-2">No results found</p>
            <p className="text-slate-500">Try different keywords or browse our resources</p>
          </div>
        )
      ) : (
        <div className="text-center py-20 text-slate-500">
          Enter a search term to find content across the site
        </div>
      )}
    </div>
  );
}

