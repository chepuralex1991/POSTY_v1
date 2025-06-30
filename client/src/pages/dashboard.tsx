import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Header } from "@/components/header";
import { UploadArea } from "@/components/upload-area";
import { FilterControls } from "@/components/filter-controls";
import { MailGrid } from "@/components/mail-grid";
import { useMailItems } from "@/hooks/use-mail-items";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  // Initialize state from URL parameters
  const [activeFilter, setActiveFilter] = useState(searchParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const { data: allItems = [], isLoading } = useMailItems();

  // Update URL when filters change
  const updateURL = useCallback((category: string, search: string) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    
    const queryString = params.toString();
    const newPath = queryString ? `/?${queryString}` : "/";
    
    if (location !== newPath) {
      setLocation(newPath);
    }
  }, [location, setLocation]);

  // Handle filter changes
  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
    updateURL(filter, searchQuery);
  }, [searchQuery, updateURL]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    updateURL(activeFilter, query);
  }, [activeFilter, updateURL]);

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "all";
    const urlSearch = searchParams.get("search") || "";
    
    if (urlCategory !== activeFilter) setActiveFilter(urlCategory);
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
  }, [useSearch()]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.extractedText && item.extractedText.toLowerCase().includes(query)) ||
        (item.fileName && item.fileName.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter if not "all"
    if (activeFilter !== "all") {
      items = items.filter(item => item.category === activeFilter);
    }
    
    // Sort by most recent first
    return items.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [allItems, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UploadArea />
        
        <FilterControls
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          resultCount={filteredItems.length}
        />
        
        <MailGrid items={filteredItems} isLoading={isLoading} />
      </div>
    </div>
  );
}
