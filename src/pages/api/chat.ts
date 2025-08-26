import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message, history } = await request.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = import.meta.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        response: "I'm sorry, but I'm not configured to respond right now. Please check back later!" 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare conversation history
    const conversationHistory = history?.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })) || [];

    // Add current message
    conversationHistory.push({ role: 'user', content: message });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for a personal website. You help visitors with questions about web development, technology, and general inquiries. Be friendly, professional, and concise. Keep responses under 200 words unless the user asks for more detail.`
          },
          ...conversationHistory
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return new Response(JSON.stringify({ 
      response: "I'm sorry, but I encountered an error. Please try again later!" 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
