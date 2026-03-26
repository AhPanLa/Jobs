const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    const prompt = process.env.IMAGE_PROMPT || "Professional minimalist tech background";
    // 关键修复：添加 --no-sandbox 参数
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();

    try {
        console.log("正在加载环境...");
        await page.goto('about:blank');
        await page.addScriptTag({ url: 'https://js.puter.com/v2/' });

        console.log(`正在生成图片，Prompt: ${prompt}`);
        const base64Data = await page.evaluate(async (p) => {
            // 确保 puter 加载完成
            let count = 0;
            while(typeof puter === 'undefined' && count < 10) {
                await new Promise(r => setTimeout(r, 1000));
                count++;
            }
            const img = await puter.ai.txt2img(p, { model: "gemini-2.5-flash-image-preview" });
            return img.src; 
        }, prompt);

        const assetsDir = path.join(__dirname, '../assets/');
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir); // 确保文件夹存在

        const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
        const fileName = `bg_${Date.now()}.png`;
        fs.writeFileSync(path.join(assetsDir, fileName), buffer);
        
        console.log(`✅ 图片生成成功: ${fileName}`);
    } catch (error) {
        console.error("❌ 绘图过程出错:", error);
        process.exit(1); // 报错时通知 GitHub Action 停止
    } finally {
        await browser.close();
    }
}

run();
