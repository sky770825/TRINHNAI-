# LINE 關鍵字回覆類型 — response_content 格式說明

CRM 關鍵字管理中的「回覆類型」與 Webhook 對應關係如下。`response_content` 欄位請依類型填寫。

---

## 1. 文字回覆 (`text`)

- **格式**：純文字，支援換行與 Emoji。
- **範例**：`歡迎！輸入「報名」可開始報名。`

---

## 2. 圖片 (`image`)

- **格式**：單一圖片網址，須為 **HTTPS**。
- **範例**：`https://example.com/image.jpg`
- Webhook 會送出 LINE Image 訊息（`originalContentUrl` / `previewImageUrl` 皆用此網址）。

---

## 3. Flex 氣泡 (`flex_bubble`)

- **格式**：單一 [LINE Flex Bubble](https://developers.line.biz/en/docs/messaging-api/flex-message-elements/#bubble) 的 **JSON 字串**。
- **範例**：
```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "標題", "weight": "bold", "size": "xl" },
      { "type": "text", "text": "內文說明" }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "button",
        "action": { "type": "message", "label": "點我回覆", "text": "點我回覆" },
        "style": "primary"
      }
    ]
  }
}
```
- Webhook 會組成 `type: "flex"` 訊息，`contents` 即此 bubble 物件。

---

## 4. Flex 輪播 (`flex_carousel`)

- **格式**：多個 bubble 的 **JSON**，可為：
  - **陣列**：`[{ bubble1 }, { bubble2 }, ...]`，Webhook 會包成 `{ type: "carousel", contents: [...] }`。
  - **物件**：`{ "type": "carousel", "contents": [ bubble1, bubble2, ... ] }`，直接使用。
- **範例**：
```json
[
  { "type": "bubble", "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "第一張" }] } },
  { "type": "bubble", "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "第二張" }] } }
]
```
- Webhook 會送出 `type: "flex"`，`contents` 為 carousel。

---

## 5. 快速回覆 (`quick_reply`)

- **格式**（純文字）：
  - **第一行**：主要文字訊息。
  - **第二行起**：快速回覆按鈕，可用 **逗號分隔** 或 **一行一個**。最多 13 個按鈕；按鈕文字即用戶點擊後回傳的訊息。
- **範例**：
```
請選擇服務類型
美甲,美睫,除毛
```
或：
```
請選擇
美甲
美睫
除毛
```
- Webhook 會送出 `type: "text"` + `quickReply.items`（每個 item 為 `action: { type: "message", label, text }`）。

---

## 6. 報名流程 (`registration`)

- **格式**：不需填寫 `response_content`。
- Webhook 會依 `bot_settings` 顯示匯款資訊與「複製匯款資訊」按鈕。

---

## 7. 預約流程 (`booking`)

- **格式**：不需在關鍵字填寫；由 Webhook 依 `service_settings` / `store_settings` 動態產生服務與分店 Flex。
- 若關鍵字設為 `booking`，會觸發預約流程的 Flex 選單。
