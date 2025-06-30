import { useState, useEffect, useCallback } from "react";
import { Search, Filter, FileText, Calendar, User, Tag, Building, Trash2, X, Shield, Heart, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMailItems, useDeleteMailItem } from "@/hooks/use-mail-items";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { CategoryManager } from "@/components/category-manager";

import { categories, type Category } from "@shared/schema";

interface FilterControlsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount?: number;
}

const categoryConfig = {
  bill: { icon: FileText, label: "Bills", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  appointment: { icon: Calendar, label: "Appointments", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  personal: { icon: User, label: "Personal", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  promotional: { icon: Tag, label: "Promotional", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  government: { icon: Building, label: "Government", color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200" },
  insurance: { icon: Shield, label: "Insurance", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  nhs: { icon: Heart, label: "NHS", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
};

export function FilterControls({ 
  activeFilter, 
  onFilterChange, 
  searchQuery, 
  onSearchChange,
  resultCount = 0
}: FilterControlsProps) {
  const { data: mailItems = [] } = useMailItems();
  const deleteMailItem = useDeleteMailItem();
  const { toast } = useToast();
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Get unique custom categories from existing mail items and localStorage
  const mailItemCategories = Array.from(
    new Set(
      mailItems
        .flatMap(item => [
          ...(item.customCategories || []),
          ...(item.customCategory ? [item.customCategory] : [])
        ])
        .filter(Boolean)
    )
  );
  
  const storedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
  const customCategories = Array.from(new Set([...mailItemCategories, ...storedCategories])).sort();
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Update the parent component when debounced search changes
  useEffect(() => {
    onSearchChange(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  // Sync local state with props when external search changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleCategoryChange = useCallback((value: string) => {
    if (value === "custom") {
      const customCategoryName = prompt("Enter a custom category name:");
      if (customCategoryName && customCategoryName.trim()) {
        toast({
          title: "Custom category created",
          description: `You can now assign documents to the "${customCategoryName.trim()}" category in the document details.`,
        });
        onFilterChange("all");
      }
      return;
    }
    onFilterChange(value);
  }, [onFilterChange, toast]);

  const handleClearFilters = useCallback(() => {
    setLocalSearchQuery("");
    onFilterChange("all");
  }, [onFilterChange]);

  const formatCategoryLabel = (category: string) => {
    if (category === "all") return "All Mail";
    if (category.startsWith("custom:")) {
      return category.replace("custom:", "");
    }
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const hasActiveFilters = activeFilter !== "all" || localSearchQuery.trim() !== "";

  const handleClearAll = async () => {
    if (mailItems.length === 0) return;
    
    if (!confirm(`Delete all ${mailItems.length} documents? This action cannot be undone.`)) return;
    
    try {
      // Delete all items
      await Promise.all(mailItems.map(item => deleteMailItem.mutateAsync(item.id)));
      
      toast({
        title: "All documents deleted",
        description: `Successfully deleted ${mailItems.length} documents.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Some documents could not be deleted. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Enhanced Search Bar with Category Selector */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={`Search ${activeFilter === "all" ? "all mail" : activeFilter}...`}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        
        {/* Category Selector */}
        <Select value={activeFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[160px] border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="w-[200px] max-h-80">
            <SelectItem value="all" className="font-medium">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                All Mail
              </div>
            </SelectItem>
            
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t bg-gray-50">
              Standard Categories
            </div>
            {categories.map((category) => {
              const config = categoryConfig[category];
              const Icon = config?.icon || Tag;
              return (
                <SelectItem key={category} value={category} className="pl-4">
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" style={{ color: config?.color.includes('red') ? '#dc2626' : 
                      config?.color.includes('amber') ? '#d97706' :
                      config?.color.includes('green') ? '#059669' :
                      config?.color.includes('purple') ? '#7c3aed' :
                      config?.color.includes('cyan') ? '#0891b2' :
                      config?.color.includes('blue') ? '#2563eb' :
                      config?.color.includes('emerald') ? '#059669' : '#6b7280' }} />
                    {formatCategoryLabel(category)}
                  </div>
                </SelectItem>
              );
            })}
            
            {customCategories.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t bg-gray-50">
                  Custom Categories
                </div>
                {customCategories.map((customCat) => (
                  <SelectItem key={`custom-${customCat}`} value={`custom:${customCat}`} className="pl-4">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-indigo-600" />
                      {customCat}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
            
            <div className="border-t bg-blue-50">
              <SelectItem value="custom" className="text-blue-700 font-medium">
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-blue-600" />
                  Add Custom Category
                </div>
              </SelectItem>
            </div>
            
            <div className="border-t bg-gray-50">
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  setShowCategoryManager(true);
                }}
                className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md mx-1"
              >
                <Settings className="w-4 h-4 mr-2 text-gray-600" />
                Manage Categories
              </div>
            </div>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="whitespace-nowrap"
          >
            Clear
          </Button>
        )}

        {/* Clear All Documents Button */}
        {mailItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={deleteMailItem.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Results Summary */}
      {resultCount !== undefined && (
        <div className="text-sm text-gray-600">
          <span>
            {resultCount} {resultCount === 1 ? "item" : "items"} 
            {activeFilter !== "all" && (
              <span className="font-medium"> in {formatCategoryLabel(activeFilter)}</span>
            )}
            {localSearchQuery.trim() && (
              <span> matching "<span className="font-medium">{localSearchQuery.trim()}</span>"</span>
            )}
          </span>
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManager 
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </div>
  );
}
