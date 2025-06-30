import { useState } from "react";
import { X, Save, Trash2, Plus, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateMailItem, useDeleteMailItem } from "@/hooks/use-mail-items";
import { useToast } from "@/hooks/use-toast";
import { CalendarReminder } from "@/components/calendar-reminder";
import type { MailItem } from "@shared/schema";
import { categories } from "@shared/schema";

interface MailModalProps {
  item: MailItem;
  isOpen: boolean;
  onClose: () => void;
}

export function MailModal({ item, isOpen, onClose }: MailModalProps) {
  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(item.categories || [item.category].filter(Boolean));
  const [selectedCustomCategories, setSelectedCustomCategories] = useState<string[]>(item.customCategories || (item.customCategory ? [item.customCategory] : []));
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [reminderDate, setReminderDate] = useState(item.reminderDate || "");
  const [showAdvancedCategories, setShowAdvancedCategories] = useState(false);

  const updateMailItem = useUpdateMailItem();
  const deleteMailItem = useDeleteMailItem();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await updateMailItem.mutateAsync({
        id: item.id,
        updates: {
          title,
          summary,
          category: selectedCategories[0] || "personal",
          customCategory: selectedCustomCategories[0] || null,
          categories: selectedCategories,
          customCategories: selectedCustomCategories,
          reminderDate: reminderDate || undefined,
          imageUrl: item.imageUrl,
          fileName: item.fileName,
        },
      });
      
      toast({
        title: "Changes saved",
        description: "Your mail item has been updated successfully.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleToggleCustomCategory = (categoryName: string) => {
    setSelectedCustomCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleAddCustomCategory = () => {
    if (!newCustomCategory.trim()) return;
    
    const trimmedName = newCustomCategory.trim();
    const existingCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
    
    if (!existingCustomCategories.includes(trimmedName)) {
      existingCustomCategories.push(trimmedName);
      localStorage.setItem('customCategories', JSON.stringify(existingCustomCategories));
    }
    
    if (!selectedCustomCategories.includes(trimmedName)) {
      setSelectedCustomCategories(prev => [...prev, trimmedName]);
    }
    
    setNewCustomCategory("");
    
    toast({
      title: "Custom category added",
      description: `"${trimmedName}" has been added to this document.`,
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this mail item?")) return;
    
    try {
      await deleteMailItem.mutateAsync(item.id);
      
      toast({
        title: "Mail deleted",
        description: "The mail item has been deleted successfully.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the mail item. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-semibold text-slate-900">Mail Details</DialogTitle>
        <DialogDescription className="sr-only">
          View and edit details for mail item: {item.title}
        </DialogDescription>
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-slate-900">Mail Details</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Document preview */}
          <div className="mb-6 bg-slate-100 rounded-lg p-4">
            {item.fileName?.toLowerCase().endsWith('.pdf') ? (
              <div className="text-center">
                <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
                  <h3 className="font-medium">PDF Document</h3>
                  <p className="text-sm">{item.fileName}</p>
                </div>
                <a 
                  href={item.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Open PDF
                </a>
              </div>
            ) : (
              <img 
                src={item.imageUrl} 
                alt={`Scan of ${item.title}`}
                className="w-full rounded-lg max-h-96 object-contain"
                onError={(e) => {
                  console.error('Failed to load modal image:', item.imageUrl);
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-family='system-ui, sans-serif' font-size='14'%3EDocument Preview%3C/text%3E%3C/svg%3E";
                }}
                onLoad={() => {
                  console.log('Modal image loaded successfully:', item.imageUrl);
                }}
              />
            )}
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="summary">AI Summary</Label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="mt-1 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            
            {item.extractedText && (
              <div>
                <Label>Extracted Text (OCR)</Label>
                <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 font-mono max-h-64 overflow-y-auto">
                    {item.extractedText}
                  </pre>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  This is the exact text extracted from your document using OCR technology.
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center justify-between">
                <Label>Categories</Label>
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedCategories(!showAdvancedCategories)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showAdvancedCategories ? 'Hide Advanced' : 'Advanced Options'}
                </Button>
              </div>
              
              {/* Current assigned categories display */}
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <span key={cat} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedCustomCategories.map((cat) => (
                    <span key={cat} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleToggleCustomCategory(cat)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(selectedCategories.length === 0 && selectedCustomCategories.length === 0) && (
                    <span className="text-sm text-gray-500">No categories assigned</span>
                  )}
                </div>
              </div>

              {/* Advanced category selection */}
              {showAdvancedCategories && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {/* Built-in Categories */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Standard Categories</Label>
                    <div className="mt-1 space-y-2">
                      {categories.map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`category-${cat}`}
                            checked={selectedCategories.includes(cat)}
                            onChange={() => handleToggleCategory(cat)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`category-${cat}`} className="text-sm capitalize">
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Categories */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">Custom Categories</Label>
                    <div className="mt-1 space-y-2">
                      {JSON.parse(localStorage.getItem('customCategories') || '[]').map((cat: string) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`custom-category-${cat}`}
                            checked={selectedCustomCategories.includes(cat)}
                            onChange={() => handleToggleCustomCategory(cat)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={`custom-category-${cat}`} className="text-sm">
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add new custom category */}
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={newCustomCategory}
                        onChange={(e) => setNewCustomCategory(e.target.value)}
                        placeholder="Add new custom category"
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                      />
                      <Button 
                        type="button"
                        onClick={handleAddCustomCategory}
                        disabled={!newCustomCategory.trim()}
                        className="px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="reminderDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Reminder Date
              </Label>
              <Input
                id="reminderDate"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="mt-1 border-amber-300 focus:border-amber-500 focus:ring-amber-200"
              />
              {reminderDate && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Reminder set for {new Date(reminderDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-3">
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMailItem.isPending}
                className="min-w-[100px] h-9 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <CalendarReminder item={item} />
            </div>
            <Button 
              onClick={handleSave}
              disabled={updateMailItem.isPending}
              className="min-w-[140px] h-9 flex-shrink-0"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
