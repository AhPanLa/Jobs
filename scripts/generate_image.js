const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
    const prompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents, 3:4 aspect ratio";
    
    // 强制加上无字、背景等关键词，确保生成效果
    const fullPrompt = encodeURIComponent(`${prompt}, minimalist, professional, high resolution, no text, flat design`);
    const imageUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=1080&height=1440&nologo=true&model=flux`;

    console.log("🎨 正在从 Flux 引擎生成背景图...");

    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(__dirname, '../assets/', fileName);

    // 确保目录存在
    if (!fs.existsSync(path.join(__dirname, '../assets/'))) {
        fs.mkdirSync(path.join(__dirname, '../assets/'), { recursive: true });
    }

    const file = fs.createWriteStream(filePath);

    https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`✅ 图片生成成功并入库: ${fileName}`);
            process.exit(0);
        });
    }).on('error', (err) => {
        console.error("❌ 下载失败:", err.message);
        process.exit(1);
    });
}

run();
