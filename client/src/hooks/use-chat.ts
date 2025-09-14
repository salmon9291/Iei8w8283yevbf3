import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendMessage, getMessages } from "@/lib/api";
import type { Message } from "@shared/schema";

export function useChat(username: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["/api/messages", username],
    queryFn: () => getMessages(username),
    enabled: !!username,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ content }: { content: string }) => sendMessage(content, username),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/messages", username], (oldMessages: Message[] = []) => [
        ...oldMessages,
        data.userMessage,
        data.aiMessage,
      ]);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    error: sendMessageMutation.error?.message,
  };
}
