const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    const prompt = process.env.IMAGE_PROMPT || "Professional minimalist tech background";
    
    console.log("🚀 启动浏览器中 (增加超时耐性)...");
    
    const browser = await puppeteer.launch({ 
        headless: true,
        // 关键修复：增加协议超时时间到 120 秒，防止 AI 画图太久导致断开
        protocolTimeout: 120000, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ] 
    });
    
    const page = await browser.newPage();
    // 设置页面导航超时
    page.setDefaultNavigationTimeout(120000);

    try {
        console.log("🌐 正在注入 Puter.js 环境...");
        await page.goto('about:blank');
        await page.addScriptTag({ url: 'https://js.puter.com/v2/' });

        // 等待 Puter 加载完成
        await page.waitForFunction(() => typeof puter !== 'undefined', { timeout: 30000 });

        console.log(`🎨 AI 开始绘图，这可能需要 30-60 秒，请稍候...`);
        
        // 这里的 evaluate 也会运行很久，所以必须确保内部逻辑稳定
        const base64Data = await page.evaluate(async (p) => {
            // 在浏览器内部调用绘图
            const img = await puter.ai.txt2img(p, { 
                model: "gemini-2.5-flash-image-preview" 
            });
            return img.src; 
        }, prompt);

        const assetsDir = path.join(__dirname, '../assets/');
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
        const fileName = `bg_${Date.now()}.png`;
        fs.writeFileSync(path.join(assetsDir, fileName), buffer);
        
        console.log(`✅ 太棒了！图片已入库: ${fileName}`);
    } catch (error) {
        console.error("❌ 绘图最终还是失败了:", error.message);
        // 如果超时，输出更详细的提示
        if (error.message.includes('timeout')) {
            console.log("提示：AI 响应时间超过了预期，请尝试简化 Prompt 或稍后再试。");
        }
        process.exit(1);
    } finally {
        await browser.close();
        console.log("🔒 浏览器已关闭");
    }
}

run();
