import express from 'express';
import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// ESモジュールで __dirname を取得するための方法
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expressアプリケーションの作成
const app = express();
const port = 3000;

// 静的ファイルの提供
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
// 日付フォーマットの関数
// ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
}

// WebSocketサーバーを作成
const wss = new WebSocketServer({ port: 8080 });
let clients = [];

// サーバーが起動したときのメッセージ
wss.on('listening', () => {
    console.log('サーバーがポート8080で起動しました');
});

// WebSocket接続時の処理
wss.on('connection', (ws) => {
    console.log('クライアントが接続しました');

    // クライアントをクライアントリストに追加
    clients.push(ws);

    // クライアントからのメッセージを受け取る
    ws.on('message', (data) => {
        console.log('受信したメッセージ:', data.toString());
    });

    // クライアントが切断したときの処理
    ws.on('close', () => {
        console.log('クライアントが接続を切断しました');
        clients = clients.filter(client => client !== ws);  // 切断されたクライアントをリストから削除
    });

    // エラーハンドリング
    ws.on('error', console.error);

    // クライアントに初期メッセージを送信
    ws.send('Connected to WebSocket server');
});

// 保存先ディレクトリ
const outputDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Puppeteerでスクリーンショットを撮る関数
let browser; // ブラウザのインスタンスを外部で管理
let page;     // ページのインスタンスを外部で管理

const captureScreenshot = async () => {

    // 既存のスクリーンショットがある場合、それをバックアップ
    const currentScreenshotPath = path.join(outputDir, 'screenshot.jpeg');
    const backupScreenshotPath = path.join(outputDir, 'screenshot_old.jpeg');
    if (fs.existsSync(currentScreenshotPath)) {
        // 現在のスクリーンショットを複製して新しい名前で保存
        fs.copyFileSync(currentScreenshotPath, backupScreenshotPath);
        //console.log('Previous screenshot has been copied to screenshot_old.jpeg');
    }

    // スクリーンショットを取得
    const screenshotBuffer = await page.screenshot();
  
    // 日時を画像に埋め込む
    const timestamp = formatDate(new Date());  // 日時をフォーマット
    const imageWithDate = await sharp(screenshotBuffer)
        .composite([{
            input: Buffer.from(
                `<svg width="400" height="60">
                   <!-- 背景の黒い矩形 -->
                   <rect x="0" y="0" width="100%" height="100%" fill="black" />
                   <!-- 日時テキスト -->
                   <text x="10" y="40" font-size="30" fill="white" font-family="Meiryo">${timestamp}</text>
                 </svg>`),
            gravity: 'northwest',  // 左上に配置
        }])
        .toBuffer();

    // 画像を保存
    fs.writeFileSync(currentScreenshotPath, imageWithDate);
    console.log(`Saved screenshot as ${currentScreenshotPath}`);

    // 接続中のクライアント全員に画像データを送信
    clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(imageWithDate);
            console.log('画像を送信しました');
        }
    });
};

// 初回アクセスしてブラウザを開いたままにする処理
const initBrowser = async () => {
    // Puppeteerのブラウザを起動
    browser = await puppeteer.launch();
    page = await browser.newPage();
  
    // Webページにアクセス
    await page.goto('https://news.yahoo.co.jp/');  // 任意のURLに変更してください
    console.log('初回アクセス完了');

    // スクリーンショットを定期的に取得する処理を開始
    setInterval(async () => {
        await captureScreenshot();
    }, 20000); // 20秒おきにスクリーンショットを取得
};

// 初回アクセスを実行
initBrowser();

// サーバーが起動したら、WebSocketサーバーを開始
wss.on('listening', () => {
    console.log('WebSocketサーバーがポート8080で起動しました');
});
