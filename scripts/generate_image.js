const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
    const rawPrompt = process.env.IMAGE_PROMPT || "Modern minimalist tech hiring poster background, dark theme, gold accents";
    // 针对 FLUX 模型优化的 Prompt
    const enhancedPrompt = `${rawPrompt}, professional corporate style, minimalist, high quality, 4k, no text`;
    
    // ✅ 关键修复：URL 必须包含 /models/ 前缀
    // 我们使用了目前最火且免费的 FLUX 模型，速度极快
    const modelUrl = "https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
    
    console.log(`🎨 正在连接 HF 路由并调用 FLUX 引擎...`);

    const assetsDir = path.join(__dirname, '../assets/');
    const fileName = `bg_${Date.now()}.png`;
    const filePath = path.join(assetsDir, fileName);

    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    const postData = JSON.stringify({ 
        inputs: enhancedPrompt,
        parameters: {
            num_inference_steps: 4 // FLUX-schnell 只需要 4 步即可出图
        }
    });

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'PanTech-Automation-Bot/2.0'
        }
    };

    console.log("⏳ AI 正在生成高清底图，请稍候...");

    const file = fs.createWriteStream(filePath);

    const req = https.request(modelUrl, options, (res) => {
        // 如果返回 503，说明模型正在初始化
        if (res.statusCode === 503) {
            console.error("⚠️ 模型还在起步 (Loading)，请等 10 秒再点一次 Postman！");
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
            console.log(`✅ 图片已入库 Asset Storage: ${fileName}`);
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ 网络请求失败: ${e.message}`);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

run();
