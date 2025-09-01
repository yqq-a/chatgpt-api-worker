#!/bin/bash

# Cloudflare Workers ChatGPT API 部署脚本

echo "🚀 开始部署 ChatGPT API Worker..."

# 检查是否已安装 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装，请先安装："
    echo "npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "🔑 请先登录到 Cloudflare："
    wrangler login
fi

# 设置环境变量
echo "🔧 设置环境变量..."

# 检查是否已设置 OPENAI_API_KEY
if ! wrangler secret list | grep -q "OPENAI_API_KEY"; then
    echo "请输入你的 OpenAI API Key:"
    read -s OPENAI_API_KEY
    echo $OPENAI_API_KEY | wrangler secret put OPENAI_API_KEY
    echo "✅ OpenAI API Key 已设置"
else
    echo "✅ OpenAI API Key 已存在"
fi

# 可选：设置访问令牌
echo "是否要设置访问令牌以保护API？(y/n):"
read -r SET_ACCESS_TOKEN

if [[ $SET_ACCESS_TOKEN == "y" || $SET_ACCESS_TOKEN == "Y" ]]; then
    if ! wrangler secret list | grep -q "ACCESS_TOKEN"; then
        echo "请输入访问令牌（或留空生成随机令牌）:"
        read -s ACCESS_TOKEN
        
        if [[ -z "$ACCESS_TOKEN" ]]; then
            ACCESS_TOKEN=$(openssl rand -hex 32)
            echo "生成的访问令牌: $ACCESS_TOKEN"
            echo "请保存此令牌，你需要在请求头中使用它"
        fi
        
        echo $ACCESS_TOKEN | wrangler secret put ACCESS_TOKEN
        echo "✅ 访问令牌已设置"
    else
        echo "✅ 访问令牌已存在"
    fi
fi

# 部署 Worker
echo "📦 部署 Worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "🎉 部署成功！"
    echo ""
    echo "API 端点："
    echo "  POST /api/chat - 聊天接口"
    echo "  GET  /api/health - 健康检查"
    echo ""
    echo "使用示例："
    echo "curl -X POST https://your-worker.your-subdomain.workers.dev/api/chat \\"
    echo "  -H 'Content-Type: application/json' \\"
    if [[ $SET_ACCESS_TOKEN == "y" || $SET_ACCESS_TOKEN == "Y" ]]; then
        echo "  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\"
    fi
    echo "  -d '{\"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}]}'"
else
    echo "❌ 部署失败"
    exit 1
fi