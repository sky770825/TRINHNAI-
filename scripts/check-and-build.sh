#!/usr/bin/env bash
# 建置前檢查：執行 build，成功則印出部署提醒
set -e
cd "$(dirname "$0")/.."
echo "🔨 執行建置..."
npm run build
echo ""
echo "✅ 建置成功。"
echo "📌 部署方式："
echo "   • Cloudflare：push 到 GitHub 或於 Dashboard 點 Retry deployment"
echo "   • 本機預覽：npm run preview"
echo "   • Supabase Edge Functions：npm run supabase:functions-deploy"
