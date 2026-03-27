const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    const enhancedPrompt = `${rawPrompt}, minimalist, high resolution, 4k, professional, no text, dark aesthetic, flat vector style`;
    
    // ✅ 关键修复：使用 Hugging Face 最新的 Router 接口
    const modelUrl = "https://router.huggingface.co/stabilityai/stable-diffusion-xl-base-1.0";
    
    console.log(`🎨 正在连接 HF 新路由 (Router API)...`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    const postData = JSON.stringify({ 
        inputs: enhancedPrompt,
        parameters: {
            width: 1024,
            height: 1024
        }
    });

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'PanTech-Studio-Bot/1.0'
        }
    };

    console.log("⏳ AI 正在新服务器上构图，请稍候...");

    const file = fs.createWriteStream(filePath);

    const req = https.request(modelUrl, options, (res) => {
        // 410/404/503 处理
        if (res.statusCode !== 200) {
            console.error(`❌ 生成失败，状态码: ${res.statusCode}`);
            let errorBody = '';
            res.on('data', (d) => errorBody += d);
            res.on('end', () => {
                console.error("错误详情:", errorBody);
                process.exit(1);
            });
            return;
        }

        res.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log(`✅ 图片已成功存入 Assets: ${fileName}`);
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ 请求错误: ${e.message}`);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

run();
