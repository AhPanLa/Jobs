const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
    // 1. 获取从 n8n 发来的 Prompt，如果没有则用默认值
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    
    // 2. 增强 Prompt，确保生成的图适合做海报底图（无文字、简约、高画质）
    const enhancedPrompt = `${rawPrompt}, minimalist, professional, high resolution, no text, flat design, 3:4 aspect ratio`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    // 3. 使用 gen.pollinations.ai (新接口) + 随机 Seed 确保多样性
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?width=1080&height=1440&nologo=true&seed=${seed}&model=flux`;

    console.log(`🎨 正在从 Flux 引擎生成背景图...`);
    console.log(`🔗 URL: ${imageUrl}`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    // 4. 确保 assets 文件夹存在
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    const file = fs.createWriteStream(filePath);

    // 5. 执行下载请求
    https.get(imageUrl, (response) => {
        // 处理可能的重定向或错误
        if (response.statusCode !== 200) {
            console.error(`❌ 请求失败，状态码: ${response.statusCode}`);
            process.exit(1);
        }

        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log(`✅ 图片生成成功并存入 Asset Storage: ${fileName}`);
            process.exit(0);
        });
    }).on('error', (err) => {
        console.error(`❌ 下载过程中出错: ${err.message}`);
        process.exit(1);
    });
}

run();
