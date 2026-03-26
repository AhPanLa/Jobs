const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    const prompt = process.env.IMAGE_PROMPT || "Minimalist tech job poster background, dark theme, flat vector";
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // 注入 Puter.js 环境
    await page.goto('about:blank');
    await page.addScriptTag({ url: 'https://js.puter.com/v2/' });

    // 在浏览器上下文中运行 Puter.js 画图
    const base64Data = await page.evaluate(async (p) => {
        // 等待 puter 加载
        await new Promise(r => setTimeout(r, 2000));
        const img = await puter.ai.txt2img(p, { model: "gemini-2.5-flash-image-preview" });
        return img.src; // 拿到 Base64
    }, prompt);

    // 将 Base64 转为二进制文件保存
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    const fileName = `bg_${Date.now()}.png`;
    fs.writeFileSync(path.join(__dirname, '../assets/', fileName), buffer);
    
    console.log(`Successfully generated: ${fileName}`);
    await browser.close();
}

run();