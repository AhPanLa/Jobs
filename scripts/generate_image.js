const fs = require('fs');
const path = require('path');

async function run() {
    // 1. 获取并清理 Prompt
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    // 强制加入背景专用关键词，并清理掉特殊字符
    const cleanPrompt = encodeURIComponent(rawPrompt.replace(/[^\w\s]/gi, '') + " professional minimalist background no text 4k");
    
    // ✅ 2. 使用 2026 年最稳的“图像直连”地址
    // 这个地址直接返回 PNG 图片，不走 JSON 路由，完美避开 404 和 401 权限问题
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://pollinations.ai/p/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    console.log(`🚀 启动“全路径绕行”方案...`);
    console.log(`🔗 图像源: ${url}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        console.log("⏳ 正在从全球节点抓取 AI 图像流...");
        
        // 使用 Node.js 20+ 的 fetch 直接获取图像流
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.status}`);
        }

        // 直接读取二进制流
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 检查返回的是不是真的图片（防止返回的是错误网页）
        if (buffer.length < 1000) {
            throw new Error("下载的文件太小，可能不是有效的图片。");
        }

        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 【奇迹终于发生】海报底图已入库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 最终方案失败: ${error.message}`);
        process.exit(1);
    }
}

run();
