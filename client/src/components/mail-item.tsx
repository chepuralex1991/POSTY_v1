import { MoreHorizontal, Calendar, Clock, FileText, User, Tag, Building, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteMailItem } from "@/hooks/use-mail-items";
import { useToast } from "@/hooks/use-toast";
import { CalendarReminder } from "@/components/calendar-reminder";
import type { MailItem } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

interface MailItemProps {
  item: MailItem;
  onClick: () => void;
}

const categoryConfig = {
  bill: { icon: FileText, label: "Bill", color: "bg-red-100 text-red-800" },
  appointment: { icon: Calendar, label: "Appointment", color: "bg-amber-100 text-amber-800" },
  personal: { icon: User, label: "Personal", color: "bg-green-100 text-green-800" },
  promotional: { icon: Tag, label: "Promotional", color: "bg-purple-100 text-purple-800" },
  government: { icon: Building, label: "Government", color: "bg-cyan-100 text-cyan-800" },
  insurance: { icon: FileText, label: "Insurance", color: "bg-blue-100 text-blue-800" },
  nhs: { icon: User, label: "NHS", color: "bg-emerald-100 text-emerald-800" },
  custom: { icon: Tag, label: "Custom", color: "bg-indigo-100 text-indigo-800" },
};

export function MailItem({ item, onClick }: MailItemProps) {
  const deleteMailItem = useDeleteMailItem();
  const { toast } = useToast();
  
  const getAllCategories = () => {
    // Get categories from new array fields first, fallback to legacy single category
    const standardCategories = item.categories || [];
    const customCategories = item.customCategories || [];
    
    // If no array categories, use legacy single category
    if (standardCategories.length === 0 && customCategories.length === 0) {
      if (item.category) {
        return [{ type: 'standard', name: item.category }];
      }
      if (item.customCategory) {
        return [{ type: 'custom', name: item.customCategory }];
      }
      return [{ type: 'standard', name: 'personal' }];
    }
    
    return [
      ...standardCategories.map(cat => ({ type: 'standard' as const, name: cat })),
      ...customCategories.map(cat => ({ type: 'custom' as const, name: cat }))
    ];
  };

  const getCategoryDisplay = (categoryItem: { type: 'standard' | 'custom', name: string }) => {
    if (categoryItem.type === 'custom') {
      return { label: categoryItem.name, color: "bg-indigo-100 text-indigo-800", icon: Tag };
    }
    
    const config = categoryConfig[categoryItem.name as keyof typeof categoryConfig];
    if (config) {
      return { label: config.label, color: config.color, icon: config.icon };
    }
    
    return { label: categoryItem.name, color: "bg-slate-100 text-slate-800", icon: Tag };
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick for opening the modal
    
    if (!confirm(`Delete "${item.title}"?`)) return;
    
    try {
      await deleteMailItem.mutateAsync(item.id);
      toast({
        title: "Document deleted",
        description: "The mail item has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the mail item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatReminderDate = (reminderDate?: string) => {
    if (!reminderDate) return "No reminder";
    
    try {
      const date = new Date(reminderDate);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      const now = new Date();
      
      if (date < now) return "Past due";
      if (date.toDateString() === now.toDateString()) return "Due today";
      
      return `Due ${format(date, "MMM d")}`;
    } catch (error) {
      console.error("Error formatting reminder date:", error, "dateString:", reminderDate);
      return "Invalid date";
    }
  };

  const formatUploadDate = (uploadDate: Date) => {
    return formatDistanceToNow(new Date(uploadDate), { addSuffix: true });
  };

  return (
    <Card 
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group relative"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-1">
            {getAllCategories().slice(0, 3).map((categoryItem, index) => {
              const config = getCategoryDisplay(categoryItem);
              const IconComponent = config.icon;
              return (
                <Badge key={`${categoryItem.type}-${categoryItem.name}-${index}`} className={`${config.color} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              );
            })}
            {getAllCategories().length > 3 && (
              <Badge className="bg-gray-100 text-gray-600 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                +{getAllCategories().length - 3} more
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md"
            onClick={handleDelete}
            disabled={deleteMailItem.isPending}
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Mail scan preview */}
        <div className="mb-4 bg-slate-100 rounded-lg p-4 text-center">
          <img 
            src={item.imageUrl} 
            alt={`Scan of ${item.title}`}
            className="w-full h-32 object-cover rounded"
            onError={(e) => {
              console.error('Failed to load image:', item.imageUrl);
              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-family='system-ui, sans-serif' font-size='14'%3EDocument Preview%3C/text%3E%3C/svg%3E";
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', item.imageUrl);
            }}
          />
        </div>
        
        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{item.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{item.summary}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-slate-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formatReminderDate(item.reminderDate || undefined)}</span>
          </div>
          <div className="flex items-center gap-2 min-w-[280px] justify-end">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 w-[140px] flex justify-end"
            >
              <CalendarReminder item={item} size="sm" variant="outline" />
            </div>
            <div className="flex items-center text-slate-500 w-[120px] justify-end">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatUploadDate(item.uploadDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
