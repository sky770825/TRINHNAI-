#!/bin/bash
# 自動修復所有已執行的 migration 並執行剩餘的 migration

set -e

echo "🔧 開始修復 migration 狀態..."

cd "$(dirname "$0")/.."

# 檢查是否已登入
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ 未登入 Supabase，請先執行: supabase login"
    exit 1
fi

echo "✅ 已確認登入 Supabase"

# 基於錯誤訊息，標記已執行的 migration
# 這些 migration 的表已經存在於資料庫中

MIGRATIONS_TO_REPAIR=(
    "20260111034619"  # leads 表已存在
    "20260111044408"  # leads 表擴充已執行
    "20260111045157"  # bookings 表已存在
    "20260111080127"  # line_users 表已存在
)

echo "📋 標記已執行的 migration..."

for migration in "${MIGRATIONS_TO_REPAIR[@]}"; do
    echo "  - 修復 migration: $migration"
    supabase migration repair --status applied "$migration" --yes || true
done

echo ""
echo "✅ Migration 修復完成！"
echo ""
echo "🚀 執行剩餘的 migration..."
supabase db push --yes

echo ""
echo "✅ 所有 migration 執行完成！"
