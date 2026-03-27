const fs = require('fs');
const path = require('path');

async function run() {
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background";
    const cleanPrompt = encodeURIComponent(rawPrompt + ", minimalist tech aesthetic, 4k, no text");
    
    // ✅ 2026 认证版接口地址
    const url = "https://image.pollinations.ai/prompt/" + cleanPrompt + "?width=1024&height=1024&nologo=true&model=flux";

    console.log(`🚀 正在使用 API Key 发起认证请求...`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // ✅ 关键修复：添加 Authorization Header
                'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}`,
                'User-Agent': 'PanTech-Automation-Bot/6.0'
            }
        });

        if (response.status === 401) {
            throw new Error("API Key 无效或已过期，请检查 GitHub Secrets。");
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`服务器报错 [${response.status}]: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 检查是否误下到了 HTML (防止跳转)
        if (buffer.toString('utf8', 0, 10).includes('<!DOCTYPE')) {
            throw new Error("下载失败：服务器返回了网页而不是图片。");
        }

        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 【认证成功】照片已存入 Assets: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 运行失败: ${error.message}`);
        process.exit(1);
    }
}

run();
