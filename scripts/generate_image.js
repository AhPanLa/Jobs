const fs = require('fs');
const path = require('path');

async function run() {
    // 1. 获取并极致简化 Prompt
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background";
    // 只保留字母和空格，防止特殊字符导致 URL 变成网页
    const cleanPrompt = encodeURIComponent(rawPrompt.replace(/[^a-zA-Z0-9\s]/g, '').trim());
    
    // ✅ 使用专门的图片生成子域名，这个地址最不容易返回网页
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

    console.log(`🚀 启动强制图像抓取...`);
    console.log(`🔗 目标地址: ${url}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        console.log("⏳ 正在下载二进制图像流...");
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`HTTP 错误: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // ✅ 关键检查：如果文件开头是 "<!DOCTYPE" 或 "<html"，说明下载的是网页而不是图片
        const fileContentStart = buffer.toString('utf-8', 0, 15);
        if (fileContentStart.includes('<!DOCTYPE') || fileContentStart.includes('<html')) {
            console.error("❌ 错误：下载到的是网页代码而非图片！请检查 Prompt。");
            process.exit(1);
        }

        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 【真正成功】照片已入库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 抓取失败: ${error.message}`);
        process.exit(1);
    }
}

run();
