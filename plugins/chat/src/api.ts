export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageResponse {
  response: string;
  tokens_used: number;
  balance: number;
}

export interface ChatConfig {
  model: string;
  max_message_length: number;
  counting_mode: string;
}

export interface EstimateCostResponse {
  estimated_tokens: number;
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  };
}

export async function sendMessage(
  message: string,
  history: ChatMessage[]
): Promise<SendMessageResponse> {
  const res = await fetch('/api/v1/plugins/chat/send', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw err;
  }
  return res.json();
}

export async function getChatConfig(): Promise<ChatConfig> {
  const res = await fetch('/api/v1/plugins/chat/config', {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load chat config');
  return res.json();
}

export async function estimateCost(message: string): Promise<EstimateCostResponse> {
  const res = await fetch('/api/v1/plugins/chat/estimate', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) return { estimated_tokens: 0 };
  return res.json();
}
