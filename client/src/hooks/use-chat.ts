import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendMessage, getMessages, clearMessages } from "@/lib/gemini";
import type { Message } from "@shared/schema";

export function useChat(username: string | null) {
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["/api/messages", username],
    queryFn: () => getMessages(username!),
    enabled: !!username,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ content }: { content: string }) => sendMessage(content, username!),
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      // Update the messages cache with both user and AI messages
      queryClient.setQueryData(["/api/messages", username], (oldMessages: Message[] = []) => [
        ...oldMessages,
        data.userMessage,
        data.aiMessage,
      ]);
      setIsTyping(false);
      
      // Return the AI message for auto-speaking
      return data.aiMessage;
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  const clearMessagesMutation = useMutation({
    mutationFn: () => clearMessages(username!),
    onSuccess: () => {
      queryClient.setQueryData(["/api/messages", username], []);
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    isTyping,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    clearMessages: clearMessagesMutation.mutate,
    isClearing: clearMessagesMutation.isPending,
    error: sendMessageMutation.error?.message,
  };
}
