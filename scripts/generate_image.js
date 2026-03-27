const fs = require('fs');
const path = require('path');

async function run() {
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    const enhancedPrompt = `${rawPrompt}, professional corporate style, minimalist, no text, 4k`;
    
    // ✅ 关键修复：Hugging Face Router 不需要 /models/ 路径
    const modelId = "black-forest-labs/FLUX.1-schnell";
    const url = `https://router.huggingface.co/${modelId}`;
    
    console.log(`🎨 正在连接 HF 新路由: ${url}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        console.log("⏳ AI 正在生成图片...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'PanTech-Automation-Bot/3.0'
            },
            body: JSON.stringify({ inputs: enhancedPrompt })
        });

        // 处理模型加载中的情况 (503)
        if (response.status === 503) {
            console.error("⚠️ 模型正在启动 (Cold Start)，请 20 秒后重试。");
            process.exit(1);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API 报错 [${response.status}]: ${errorText}`);
            // 如果这个模型不行，提示换回 SDXL
            if (response.status === 404) console.log("提示：如果路由依然 404，请尝试将 modelId 改为 stabilityai/stable-diffusion-xl-base-1.0");
            process.exit(1);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 图片已成功存入 Assets 仓库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 运行出错: ${error.message}`);
        process.exit(1);
    }
}

run();
