const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
    // 1. 获取 Prompt
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    const enhancedPrompt = `${rawPrompt}, minimalist, high resolution, 4k, professional, no text, dark aesthetic, flat vector style`;
    
    // 2. 使用 Hugging Face 顶级的 SDXL 模型
    const modelUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    console.log(`🎨 正在调用 Hugging Face 引擎 (SDXL)...`);

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
            height: 1024 // SDXL 标准尺寸
        }
    });

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`, // 从环境变量读取，不硬编码
            'Content-Type': 'application/json',
            'User-Agent': 'PanTech-Studio-Bot/1.0'
        }
    };

    console.log("⏳ AI 正在思考并构图，请稍后...");

    const file = fs.createWriteStream(filePath);

    const req = https.request(modelUrl, options, (res) => {
        // 如果返回 503，说明模型正在加载，需要等几十秒
        if (res.statusCode === 503) {
            console.error("⚠️ 模型正在加载 (Loading Model)，请 20 秒后再试一次。");
            process.exit(1);
        }

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
            console.log(`✅ 底图已成功存入 Assets: ${fileName}`);
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ 网络请求错误: ${e.message}`);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

run();
