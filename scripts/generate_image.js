const fs = require('fs');
const path = require('path');

async function run() {
    // 1. 获取并清理 Prompt
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background";
    // 强制加入背景关键词，并确保没有奇怪字符
    const cleanPrompt = encodeURIComponent(rawPrompt + " professional minimalist background 4k");
    
    // ✅ 关键修复：使用 Pollinations 的公共免费接口
    // 注意：我们去掉了 model=flux 和 Authorization 头部，确保不触发 401 报错
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://pollinations.ai/p/${cleanPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

    console.log(`🚀 启动“零成本”生成方案...`);
    console.log(`🔗 图像源: ${url}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        console.log("⏳ 正在抓取 AI 图像流 (无需 API Key)...");
        
        const response = await fetch(url, {
            headers: {
                // 伪装成浏览器，防止被机房防火墙拦截
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`服务器响应异常: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 简单检查下是不是图片
        if (buffer.length < 5000) {
            throw new Error("下载的数据过小，可能不是图片，请重试。");
        }

        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 【大功告成】海报底图已成功入库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 方案失败: ${error.message}`);
        process.exit(1);
    }
}

run();
