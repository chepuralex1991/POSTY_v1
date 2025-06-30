import { useState } from "react";
import { Calendar, ChevronDown, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { MailItem } from "@shared/schema";
import { 
  createCalendarEvent, 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl,
  downloadICSFile 
} from "@/lib/calendar";

interface CalendarReminderProps {
  item: MailItem;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function CalendarReminder({ item, variant = "outline", size = "sm" }: CalendarReminderProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  if (!item.reminderDate) {
    return null;
  }

  const calendarEvent = createCalendarEvent(item);

  const handleAddToGoogle = () => {
    const url = generateGoogleCalendarUrl(calendarEvent);
    window.open(url, '_blank');
    toast({
      title: "Opening Google Calendar",
      description: "Adding your reminder to Google Calendar.",
    });
    setIsOpen(false);
  };

  const handleAddToApple = () => {
    downloadICSFile(calendarEvent, `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_reminder.ics`);
    toast({
      title: "Calendar file downloaded",
      description: "Open the .ics file to add to Apple Calendar or other calendar apps.",
    });
    setIsOpen(false);
  };

  const handleAddToOutlook = () => {
    const url = generateOutlookCalendarUrl(calendarEvent);
    window.open(url, '_blank');
    toast({
      title: "Opening Outlook Calendar",
      description: "Adding your reminder to Outlook Calendar.",
    });
    setIsOpen(false);
  };

  const handleDownloadICS = () => {
    downloadICSFile(calendarEvent, `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_reminder.ics`);
    toast({
      title: "Calendar file downloaded",
      description: "Import this .ics file into any calendar application.",
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1 w-[140px] h-9 flex-shrink-0 whitespace-nowrap">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="flex-shrink-0">Add Reminder</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-slate-900 border-b">
          Add to Calendar
        </div>
        <DropdownMenuItem onClick={handleAddToGoogle} className="gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          Google Calendar
          <ExternalLink className="w-3 h-3 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToApple} className="gap-2">
          <div className="w-4 h-4 bg-slate-800 rounded-sm flex items-center justify-center">
            <Calendar className="w-2.5 h-2.5 text-white" />
          </div>
          Apple Calendar
          <Download className="w-3 h-3 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToOutlook} className="gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          Outlook Calendar
          <ExternalLink className="w-3 h-3 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="gap-2">
          <Download className="w-4 h-4" />
          Download .ics file
          <span className="text-xs text-slate-500 ml-auto">Universal</span>
        </DropdownMenuItem>
        <div className="px-2 py-1.5 text-xs text-slate-500 border-t">
          Reminder: {new Date(item.reminderDate).toLocaleDateString()}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}