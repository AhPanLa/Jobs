const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    const prompt = process.env.IMAGE_PROMPT || "Professional minimalist tech background";
    
    console.log("🚀 启动浏览器中...");
    
    // 这里的 args 数组是修复的关键
    const browser = await puppeteer.launch({ 
        headless: true, // 新版 Puppeteer 建议直接用 true
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', // 极其重要：GitHub Actions 内存文件系统限制
            '--disable-accelerated-2d-canvas', 
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process' // 在 CI 环境下更稳定
        ] 
    });
    
    const page = await browser.newPage();

    try {
        console.log("🌐 正在注入 Puter.js 环境...");
        await page.goto('about:blank');
        await page.addScriptTag({ url: 'https://js.puter.com/v2/' });

        // 增加等待时间确保脚本加载
        await new Promise(r => setTimeout(r, 2000));

        console.log(`🎨 正在生成图片，Prompt: ${prompt}`);
        const base64Data = await page.evaluate(async (p) => {
            if (typeof puter === 'undefined') throw new Error("Puter.js 未能加载");
            const img = await puter.ai.txt2img(p, { model: "gemini-2.5-flash-image-preview" });
            return img.src; 
        }, prompt);

        const assetsDir = path.join(__dirname, '../assets/');
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
        const fileName = `bg_${Date.now()}.png`;
        fs.writeFileSync(path.join(assetsDir, fileName), buffer);
        
        console.log(`✅ 图片生成成功并保存为: ${fileName}`);
    } catch (error) {
        console.error("❌ 绘图失败:", error.message);
        process.exit(1);
    } finally {
        await browser.close();
        console.log("🔒 浏览器已关闭");
    }
}

run();
