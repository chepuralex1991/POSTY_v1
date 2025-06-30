import type { MailItem } from "@shared/schema";

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export function createCalendarEvent(item: MailItem): CalendarEvent {
  const reminderDate = item.reminderDate ? new Date(item.reminderDate) : new Date();
  
  // Set reminder time to 9 AM
  reminderDate.setHours(9, 0, 0, 0);
  
  const endDate = new Date(reminderDate);
  endDate.setHours(10, 0, 0, 0); // 1 hour duration
  
  return {
    title: `📄 ${item.title}`,
    description: `${item.summary}\n\nDocument Category: ${item.category}\nUploaded: ${new Date(item.uploadDate).toLocaleDateString()}`,
    startDate: reminderDate,
    endDate: endDate
  };
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description,
    location: event.location || ''
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateAppleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description,
    location: event.location || ''
  });
  
  return `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Posty//Mail Reminder//EN
BEGIN:VEVENT
UID:${Date.now()}@posty.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
${event.location ? `LOCATION:${event.location}` : ''}
END:VEVENT
END:VCALENDAR`;
}

export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString();
  };
  
  const params = new URLSearchParams({
    subject: event.title,
    startdt: formatDate(event.startDate),
    enddt: formatDate(event.endDate),
    body: event.description,
    location: event.location || ''
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadICSFile(event: CalendarEvent, filename: string = 'reminder.ics'): void {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Posty//Mail Reminder//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@posty.app
DTSTAMP:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
${event.location ? `LOCATION:${event.location}` : ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}