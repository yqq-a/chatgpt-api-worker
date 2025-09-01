// Cloudflare Workers 代理 ChatGPT API
// 为 Pages 应用提供聊天接口

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    const url = new URL(request.url);
    
    // 路由处理
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChatRequest(request, env);
    }
    
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: getCORSHeaders()
      });
    }
    
    // 默认响应
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: getCORSHeaders()
    });
  },
};

// 处理聊天请求
async function handleChatRequest(request, env) {
  try {
    // 验证 API 密钥（可选）
    const authHeader = request.headers.get('Authorization');
    if (env.ACCESS_TOKEN && authHeader !== `Bearer ${env.ACCESS_TOKEN}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: getCORSHeaders()
      });
    }

    // 解析请求体
    const body = await request.json();
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 2048 } = body;

    // 验证请求参数
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: getCORSHeaders()
      });
    }

    // 构建 OpenAI API 请求
    const openaiRequest = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: false
    };

    // 调用 OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequest)
    });

    // 检查 OpenAI API 响应
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI API error:', errorData);
      
      return new Response(JSON.stringify({ 
        error: 'OpenAI API error', 
        details: errorData.error?.message || 'Unknown error'
      }), {
        status: openaiResponse.status,
        headers: getCORSHeaders()
      });
    }

    // 返回成功响应
    const responseData = await openaiResponse.json();
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: getCORSHeaders()
    });

  } catch (error) {
    console.error('Chat request error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: getCORSHeaders()
    });
  }
}

// 处理 CORS 预检请求
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// 获取 CORS 头部
function getCORSHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}