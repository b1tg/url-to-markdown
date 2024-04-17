// Usage: node url-to-markdown.js <URL> 1.md
import puppeteer from "puppeteer";
import TurndownService from "turndown";
import fs from "fs";
if (process.argv.length < 4) {
	console.log("Usage: node url-to-markdown.js <URL> 1.md")
	process.exit(-1);
}
const url = process.argv[2];
const out = process.argv[3];
const browser = await puppeteer.launch({
	headless: false, // args: ["--proxy-server=http://127.0.0.1:7890"]
});
let page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.setRequestInterception(true);
page.on('request', (request) => {
    if (request.resourceType() === 'image') {
        request.abort(); // Block image requests
    } else {
        request.continue();
    }
});
const turndownService = new TurndownService({
    headingStyle: "atx",
});
await page.exposeFunction('turndown', (content) => {
    return turndownService.turndown(content);
});
try {
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });
    const markdown = await page.evaluate(() => {
        return window.turndown(document.body.innerHTML);
    });
    fs.writeFileSync(out, markdown);
    console.log(`written to ${out}`)
    await page.close();
    await browser.close();
} catch (error) {
    console.log("error", error);
}