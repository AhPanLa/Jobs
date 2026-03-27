const fs = require('fs');
const path = require('path');

async function run() {
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    const enhancedPrompt = `${rawPrompt}, professional corporate style, minimalist, no text, 4k`;
    
    // ✅ 关键修复：使用 2026 年标准的 OpenAI 兼容路由
    const url = "https://router.huggingface.co/v1/images/generations";
    const modelId = "stabilityai/stable-diffusion-xl-base-1.0"; // 如果这个报错，可以换成 SG161222/RealVisXL_V4.0
    
    console.log(`🚀 正在通过 2026 标准路由连接 AI 引擎...`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelId,
                prompt: enhancedPrompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json" // 我们直接要 Base64 数据，防止图片过期
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ AI 引擎拒绝了请求 [${response.status}]:`, errorData.error?.message || "未知错误");
            process.exit(1);
        }

        const json = await response.json();
        const base64Data = json.data[0].b64_json;
        
        // 将 Base64 保存为 PNG 文件
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 【奇迹发生】海报底图已入库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 系统级崩溃: ${error.message}`);
        process.exit(1);
    }
}

run();
