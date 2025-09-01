# ChatGPT API Worker

这是一个运行在 Cloudflare Workers 上的 ChatGPT API 代理服务，为你的 Pages 应用提供聊天功能接口。

## 功能特性

- 🚀 基于 Cloudflare Workers，全球边缘计算
- 🔐 支持访问令牌保护（可选）
- 🌐 自动处理 CORS 跨域请求
- 📝 支持完整的 ChatGPT 对话功能
- 🏥 内置健康检查端点
- 💰 成本效益高，按使用量付费

## API 端点

### POST /api/chat
聊天对话接口

**请求头:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN (可选)
```

**请求体:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "你好！"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**响应:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "你好！有什么我可以帮助你的吗？"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

### GET /api/health
健康检查接口

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/yqq-a/chatgpt-api-worker.git
cd chatgpt-api-worker
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 配置 Wrangler
编辑 `wrangler.toml` 文件，替换以下内容：
- 修改 `name` 为你的 Worker 名称
- 如果有自定义域名，配置 `routes` 部分

### 4. 设置环境变量
```bash
# 设置 OpenAI API Key（必需）
wrangler secret put OPENAI_API_KEY

# 设置访问令牌（可选，用于保护 API）
wrangler secret put ACCESS_TOKEN
```

### 5. 部署
```bash
# 使用脚本部署（推荐）
chmod +x deploy.sh
./deploy.sh

# 或手动部署
npm run deploy
```

## 在 Pages 应用中使用

### JavaScript 示例
```javascript
class ChatAPI {
  constructor(baseURL, accessToken = null) {
    this.baseURL = baseURL;
    this.accessToken = accessToken;
  }

  async sendMessage(messages, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        model: options.model || 'gpt-3.5-turbo',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  }

  async checkHealth() {
    const response = await fetch(`${this.baseURL}/api/health`);
    return await response.json();
  }
}

// 使用示例
const chatAPI = new ChatAPI('https://your-worker.your-subdomain.workers.dev');

async function chat() {
  try {
    const response = await chatAPI.sendMessage([
      { role: 'user', content: '你好！' }
    ]);
    
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('聊天失败:', error);
  }
}
```

### React 组件示例
```jsx
import { useState } from 'react';

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://your-worker.your-subdomain.workers.dev/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // 如果设置了访问令牌
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages([...newMessages, data.choices[0].message]);
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index} className={msg.role}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
```

## 环境变量

| 变量名 | 必需 | 描述 |
|--------|------|------|
| `OPENAI_API_KEY` | ✅ | OpenAI API 密钥 |
| `ACCESS_TOKEN` | ❌ | API 访问令牌（用于保护接口） |

## 开发

### 本地开发
```bash
# 创建本地环境变量文件
echo "OPENAI_API_KEY=your_openai_api_key" > .dev.vars

# 启动开发服务器
npm run dev
```

### 查看日志
```bash
wrangler tail
```

## 部署到生产环境

1. 确保已设置所有必需的环境变量
2. 运行 `npm run deploy`
3. 在你的域名设置中配置路由（如果使用自定义域名）

## 安全注意事项

- 🔒 建议设置 `ACCESS_TOKEN` 来保护你的 API
- 🌐 考虑限制 CORS 源域名而不是使用 `*`
- 📊 监控使用量，避免超出 OpenAI API 配额
- 🛡️ 在生产环境中添加速率限制

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！