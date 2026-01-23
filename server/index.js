const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
// const fetch = require('node-fetch'); // Use native fetch in Node 18+

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '../')));

const COZE_API_KEY = process.env.COZE_API_KEY;
const COZE_BOT_ID = process.env.COZE_BOT_ID;

// Coze API Endpoints
const COZE_UPLOAD_URL = 'https://api.coze.cn/v1/files/upload';
const COZE_CHAT_URL = 'https://api.coze.cn/v3/chat';

// Helper to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Endpoint: Upload Image
 * Receives an image file from frontend, uploads to Coze, returns file_id.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Received file upload:', req.file.originalname, req.file.size, 'bytes');

    // Prepare FormData for Coze API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('Uploading to Coze...', COZE_UPLOAD_URL);

    const response = await fetch(COZE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();
    console.log('Coze Upload Response:', JSON.stringify(data, null, 2));

    if (data.code !== 0) {
      throw new Error(`Coze Upload Failed: ${data.msg}`);
    }

    // Return the file_id and url to frontend
    res.json({
      file_id: data.data.id,
      url: data.data.url || '' // Some APIs might not return URL immediately
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Chat
 * Handles text and optional image (via file_id).
 * Uses Coze v3 Chat API.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { query, user, file_id } = req.body;
    
    console.log('Received chat request:', { query, user, file_id });

    // Construct v3 Chat Payload
    const messages = [];
    
    if (file_id) {
      // Multimodal message (Text + Image)
      const contentObject = [
        { type: 'text', text: query || 'Analyze this image' },
        { type: 'image', file_id: file_id }
      ];
      
      messages.push({
        role: 'user',
        content_type: 'object_string',
        content: JSON.stringify(contentObject)
      });
    } else {
      // Simple Text message
      messages.push({
        role: 'user',
        content_type: 'text',
        content: query
      });
    }

    const requestBody = {
      bot_id: COZE_BOT_ID,
      user_id: user || 'user_123',
      additional_messages: messages,
      stream: true,
      auto_save_history: true
    };

    console.log('Calling Coze v3 Chat API (Streaming)...', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(COZE_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API Error:', response.status, errorText);
      return res.status(response.status).send(errorText);
    }

    // Read the full stream
    const text = await response.text();
    console.log('Stream finished. Response length:', text.length);

    // Check if response is a JSON error (e.g. Invalid Token)
    try {
        // Only try to parse if it looks like JSON (starts with {)
        if (text.trim().startsWith('{')) {
            const jsonResponse = JSON.parse(text);
            if (jsonResponse.code && jsonResponse.code !== 0) {
                console.error('Coze API Error Response:', jsonResponse);
                
                // Fallback to Mock response for demo purposes
                const mockAnswer = `**[系统提示：演示模式]**\n\n检测到 Coze API 调用失败（错误码: ${jsonResponse.code}，信息: ${jsonResponse.msg}）。\n\n当前回复为模拟内容：\n\n针对您的问题 **"${query}"**，正常情况下 AI 会根据电路知识库提供专业建议。请检查 \`server/.env\` 文件中的 \`COZE_API_KEY\` 是否正确。`;
                
                return res.json({ answer: mockAnswer });
            }
        }
    } catch (e) {
        // Not a JSON error, proceed with SSE parsing
    }

    // Parse SSE events
    const lines = text.split('\n');
    let fullAnswer = '';
    let currentMessageId = '';

    for (const line of lines) {
        if (line.startsWith('data:')) {
            try {
                const dataStr = line.substring(5).trim();
                if (!dataStr) continue;
                
                const data = JSON.parse(dataStr);
                
                // Handle different event types if needed, or just look for message content
                // In v3, we look for conversation.message.delta or conversation.message.completed
                // But the 'data' field in the event usually contains the message object
                
                if (data.type === 'answer' && data.role === 'assistant') {
                     // For 'completed' events or full message updates
                     if (data.content) {
                        // If it's a full message, we might overwrite or append?
                        // Usually 'delta' events append, 'completed' has full?
                        // Let's rely on 'conversation.message.completed' if available, or accumulate deltas?
                        // Wait, without 'event: ...' line parsing, we rely on the data structure.
                        
                        // If checking the Coze V3 docs:
                        // event: conversation.message.delta -> data: { content: "...", ... }
                        // event: conversation.message.completed -> data: { content: "...", ... }
                        
                        // Let's just check if content exists and append it? 
                        // But wait, 'completed' might duplicate 'delta' content.
                        // Safe bet: Collect 'delta' content.
                     }
                }
                
                // Let's look at the structure more generically
                if (data.content && data.role === 'assistant' && data.type === 'answer') {
                     // If it's a completed message (usually has an ID), we can use it.
                     // But with streaming, we get deltas.
                     // Let's try to find the event type from the previous line?
                     // SSE format:
                     // event: ...
                     // data: ...
                     
                     // My simple split logic might separate event and data.
                }
            } catch (e) {
                // Ignore parse errors for keep-alive or empty lines
            }
        }
    }
    
    // Improved SSE Parsing
    let eventType = '';
    const events = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
            eventType = trimmed.substring(6).trim();
        } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
                const data = JSON.parse(dataStr);
                events.push({ event: eventType, data });
                
                if (eventType === 'conversation.message.delta') {
                    if (data.content && data.type === 'answer') {
                        fullAnswer += data.content;
                    }
                } else if (eventType === 'conversation.message.completed') {
                    // If we missed deltas, we could use this, but deltas are safer for streaming
                    if (data.type === 'answer' && !fullAnswer) {
                        fullAnswer = data.content;
                    }
                } else if (eventType === 'conversation.chat.failed') {
                    if (data.last_error && data.last_error.code !== 0) {
                         const errCode = data.last_error.code;
                         const errMsg = data.last_error.msg;
                         fullAnswer = `**[系统提示：服务受限]**\n\nCoze API 返回错误（代码: ${errCode}）：${errMsg}\n\n这通常意味着账户余额不足或配额已耗尽。请检查 Coze 平台状态。`;
                    }
                }
            } catch (e) { console.error('JSON Parse Error:', e); }
        }
    }

    console.log('Final Answer:', fullAnswer);

    res.json({
        answer: fullAnswer || "No response generated",
        original_response: events // For debug
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Export for Vercel
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
