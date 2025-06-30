import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MailItem, InsertMailItem } from "@shared/schema";

export function useMailItems() {
  return useQuery<MailItem[]>({
    queryKey: ["/api/mail-items"],
  });
}

export function useMailItem(id: number) {
  return useQuery<MailItem>({
    queryKey: ["/api/mail-items", id],
    enabled: !!id,
  });
}

export function useCreateMailItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/mail-items", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mail-items"] });
    },
  });
}

export function useUpdateMailItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertMailItem> }) => {
      const response = await apiRequest("PATCH", `/api/mail-items/${id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mail-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-items", data.id] });
    },
  });
}

export function useDeleteMailItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/mail-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mail-items"] });
    },
  });
}

export function useSearchMailItems(query: string) {
  return useQuery<MailItem[]>({
    queryKey: ["/api/mail-items/search", query],
    enabled: query.length > 0,
  });
}
