import { useState } from "react";
import { Inbox } from "lucide-react";
import { MailItem } from "./mail-item";
import { MailModal } from "./mail-modal";
import type { MailItem as MailItemType } from "@shared/schema";

interface MailGridProps {
  items: MailItemType[];
  isLoading?: boolean;
}

export function MailGrid({ items, isLoading }: MailGridProps) {
  const [selectedItem, setSelectedItem] = useState<MailItemType | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 bg-slate-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-slate-200 rounded"></div>
            </div>
            <div className="h-32 bg-slate-200 rounded mb-4"></div>
            <div className="h-5 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="mx-auto h-16 w-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No mail items found</h3>
        <p className="text-slate-600">Try adjusting your filters or upload some mail to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <MailItem
            key={item.id}
            item={item}
            onClick={() => setSelectedItem(item)}
          />
        ))}
      </div>

      {selectedItem && (
        <MailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
