const fs = require('fs');
const path = require('path');

async function run() {
    // 1. 获取并处理 Prompt
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    const enhancedPrompt = `${rawPrompt}, professional corporate style, minimalist, no text, high resolution, 4k, clean composition`;
    
    // ✅ 关键修复：换回对免费 API 最友好的 SDXL 模型
    const modelId = "stabilityai/stable-diffusion-xl-base-1.0";
    const url = `https://router.huggingface.co/${modelId}`;
    
    console.log(`🎨 正在连接 HF 稳定路由: ${url}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        console.log("⏳ AI 正在生成高清底图 (SDXL 引擎)...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'PanTech-Automation-Bot/4.0'
            },
            body: JSON.stringify({ inputs: enhancedPrompt })
        });

        // 2. 处理 503 (模型正在起步)
        if (response.status === 503) {
            console.error("⚠️ 模型正在热身 (Loading Model)，请 20 秒后重新运行 Action！");
            process.exit(1);
        }

        // 3. 处理报错
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API 报错 [${response.status}]: ${errorText}`);
            process.exit(1);
        }

        // 4. 保存二进制图片
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 太棒了！图片已成功入库 Assets 仓库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 运行崩溃: ${error.message}`);
        process.exit(1);
    }
}

run();
