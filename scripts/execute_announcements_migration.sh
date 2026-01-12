#!/bin/bash
# 自動執行 announcements migration 腳本

set -e  # 遇到錯誤時退出

echo "🚀 開始執行 announcements migration..."

# 進入專案目錄
cd "$(dirname "$0")/.."

# 檢查是否已登入 Supabase
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ 未登入 Supabase，請先執行: supabase login"
    exit 1
fi

echo "✅ 已確認登入 Supabase"

# 使用 SQL Editor API 執行 migration
# 或者使用 supabase db execute 執行單個 migration 檔案

MIGRATION_FILE="supabase/migrations/20260112065349_create_announcements.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration 檔案不存在: $MIGRATION_FILE"
    exit 1
fi

echo "📄 找到 migration 檔案: $MIGRATION_FILE"

# 方法 1: 使用 supabase db execute（如果支援）
# supabase db execute --file "$MIGRATION_FILE" 2>&1

# 方法 2: 直接使用 psql（需要資料庫連線資訊）
echo "ℹ️  請使用以下方式執行 migration:"
echo ""
echo "方式 A: 使用 Supabase Dashboard SQL Editor"
echo "  1. 前往: https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new"
echo "  2. 複製 $MIGRATION_FILE 的內容"
echo "  3. 貼上並執行"
echo ""
echo "方式 B: 使用 Supabase CLI（推薦）"
echo "  supabase db push"
echo ""

# 實際執行（使用 psql，如果有資料庫連線資訊）
# 這需要環境變數: SUPABASE_DB_URL 或類似的連線字串

if [ -n "$SUPABASE_DB_URL" ]; then
    echo "🔗 使用資料庫連線執行 migration..."
    psql "$SUPABASE_DB_URL" -f "$MIGRATION_FILE"
    echo "✅ Migration 執行完成！"
else
    echo "⚠️  未設定 SUPABASE_DB_URL，無法自動執行"
    echo "   請使用方式 A 或 B 執行 migration"
fi
