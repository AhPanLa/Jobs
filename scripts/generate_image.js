const fs = require('fs');
const path = require('path');

async function run() {
    // 1. 获取并增强 Prompt
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    const enhancedPrompt = `${rawPrompt}, professional corporate style, minimalist, high quality, no text, clean composition`;
    
    // ✅ 关键修复：使用 Hugging Face 最核心、不经过跳转的 API 路径
    // 我们选择 SDXL 作为底稿，因为它的兼容性是全站最强的
    const modelId = "stabilityai/stable-diffusion-xl-base-1.0";
    const url = `https://huggingface.co/api/models/${modelId}/inference`;
    
    console.log(`🎨 正在连接 HF 核心节点: ${url}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    try {
        console.log("⏳ AI 正在深度构图 (SDXL Core Engine)...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'PanTech-Automation-Bot/5.0'
            },
            body: JSON.stringify({ 
                inputs: enhancedPrompt,
                parameters: {
                    wait_for_model: true // 关键：如果模型在睡觉，强制等它醒来
                }
            })
        });

        // 处理 503 (模型正在起步)
        if (response.status === 503) {
            console.error("⚠️ 模型正在“起床” (Cold Start)，请等待 20 秒后再次点一下 Postman。");
            process.exit(1);
        }

        // 捕获所有非 200 的报错
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ 接口报错 [${response.status}]: ${errorText}`);
            console.log("提示：如果依然 404，请确认您的 HF_TOKEN 是否正确配置在 GitHub Secrets 中。");
            process.exit(1);
        }

        // 保存文件
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        console.log(`✅ 【大功告成】图片已入库: ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error(`❌ 系统崩溃: ${error.message}`);
        process.exit(1);
    }
}

run();
