import { useState } from "react";
import { Plus, Edit3, Trash2, Settings, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMailItems, useUpdateMailItem, useDeleteMailItem } from "@/hooks/use-mail-items";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@shared/schema";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { data: mailItems = [] } = useMailItems();
  const updateMailItem = useUpdateMailItem();
  const deleteMailItem = useDeleteMailItem();
  const { toast } = useToast();
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Get unique custom categories from existing mail items and localStorage
  const mailItemCategories = Array.from(
    new Set(
      mailItems
        .filter(item => item.category === "custom" && item.customCategory)
        .map(item => item.customCategory!)
    )
  );
  
  const storedCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
  const customCategories = Array.from(new Set([...mailItemCategories, ...storedCategories])).sort();

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const trimmedName = newCategoryName.trim();
    
    // Check if category already exists
    if (customCategories.includes(trimmedName)) {
      toast({
        title: "Category exists",
        description: "This custom category already exists.",
        variant: "destructive",
      });
      return;
    }

    // Create a dummy mail item to demonstrate the category (this will be improved later)
    // For now, we'll just show success and the category will appear when actual documents use it
    toast({
      title: "Custom category created",
      description: `"${trimmedName}" is ready to use. Assign it to documents to see it in filters.`,
    });
    
    setNewCategoryName("");
    
    // Store the category name in localStorage temporarily for immediate UI feedback
    const existingCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
    if (!existingCustomCategories.includes(trimmedName)) {
      existingCustomCategories.push(trimmedName);
      localStorage.setItem('customCategories', JSON.stringify(existingCustomCategories));
    }
  };

  const handleEditCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingCategory(null);
      setEditValue("");
      return;
    }

    const trimmedNewName = newName.trim();
    
    // Check if new name already exists
    if (customCategories.includes(trimmedNewName)) {
      toast({
        title: "Category exists",
        description: "This custom category name already exists.",
        variant: "destructive",
      });
      return;
    }

    // Update all mail items that use this custom category
    const itemsToUpdate = mailItems.filter(
      item => item.category === "custom" && item.customCategory === oldName
    );

    try {
      await Promise.all(
        itemsToUpdate.map(item =>
          updateMailItem.mutateAsync({
            id: item.id,
            updates: {
              customCategory: trimmedNewName,
              title: item.title,
              summary: item.summary,
              category: "custom",
              reminderDate: item.reminderDate || undefined,
              imageUrl: item.imageUrl,
              fileName: item.fileName,
            },
          })
        )
      );

      toast({
        title: "Category renamed",
        description: `"${oldName}" has been renamed to "${trimmedNewName}".`,
      });

      setEditingCategory(null);
      setEditValue("");
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to rename category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const itemsWithCategory = mailItems.filter(
      item => item.category === "custom" && item.customCategory === categoryName
    );

    if (itemsWithCategory.length === 0) {
      // Remove from localStorage
      const existingCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
      const updatedCategories = existingCustomCategories.filter((cat: string) => cat !== categoryName);
      localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
      
      toast({
        title: "Category removed",
        description: `"${categoryName}" category has been removed.`,
      });
      return;
    }

    const confirmDelete = window.confirm(
      `This will delete ${itemsWithCategory.length} document(s) that use the "${categoryName}" category. Are you sure?`
    );

    if (!confirmDelete) return;

    try {
      await Promise.all(
        itemsWithCategory.map(item => deleteMailItem.mutateAsync(item.id))
      );

      // Also remove from localStorage
      const existingCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
      const updatedCategories = existingCustomCategories.filter((cat: string) => cat !== categoryName);
      localStorage.setItem('customCategories', JSON.stringify(updatedCategories));

      toast({
        title: "Category deleted",
        description: `"${categoryName}" and ${itemsWithCategory.length} associated document(s) have been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditValue(categoryName);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Manage Categories
        </DialogTitle>
        <DialogDescription>
          Add, edit, or delete custom categories for your documents.
        </DialogDescription>

        <div className="space-y-6">
          {/* Add new category */}
          <div>
            <Label htmlFor="newCategory">Add New Category</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
              />
              <Button 
                onClick={handleAddCustomCategory}
                disabled={!newCategoryName.trim()}
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Standard categories (read-only) */}
          <div>
            <Label className="text-sm font-medium text-gray-600">Standard Categories</Label>
            <div className="mt-2 space-y-1">
              {categories.map((category) => (
                <div key={category} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <span className="text-sm capitalize">{category}</span>
                  <span className="text-xs text-gray-500">Built-in</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom categories */}
          {customCategories.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Custom Categories</Label>
              <div className="mt-2 space-y-1">
                {customCategories.map((category) => (
                  <div key={category} className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-md">
                    {editingCategory === category ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCategory(category, editValue);
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCategory(category, editValue)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(category)}
                            className="h-8 w-8 p-0"
                            title="Edit category"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(category)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Delete category"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {customCategories.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No custom categories yet. Add one above to get started.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}