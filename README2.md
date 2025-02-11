# README

# 機能改修および実装予定の処理内容

## 1. サーバーサイドの機能改修

### エラーハンドリングの強化
- サーバー側のコードでエラーとなり得る箇所すべてを`try-catch`で対処する。
- `try-catch`で捕捉したエラーはMongoDBにエラーログとして登録する。
- pauueteerでブラウザへのログインが失敗した際に、エラー検出、一定時間経過後に再ログインを試みるロジックの追加
- 何かしらの理由でHTTPサーバが終了してしまった場合は、再度HTTPサーバーを起動するようなロジックを追加

### 処理の停止・再開
- サーバー側のコードは無限ループで動作しており、その中の処理は**朝8時～夜22時以外**は`ブラウザ`キャプチャー処理を停止し、ブラウザもすべて閉じる。  
  朝8時になれば処理を再開。
- **朝8時・夜22時の判定**は1分に1回実施。

### 二重処理防止
- クライアント側からのコマンド要求に対して、サーバー側で**二重処理**されないように、処理が動いているか確認する`if文`を追加。

### サーバーコードの整理
- サーバーサイドのコードである`app.js`を処理内容ごとに**ファイル分割**する。
- Account.js、ErrorLogToDB.jsのファイル名称を変更する。-> models_Account.js、models_ErrorLog.jsなど
- Accountという表現は直観的に何をさしているのか分かりにくい。→ pulseProfileとういう名称に変更する。
　オブジェクトもaccountの名称のため、これも変更する

---

## 2. クライアントサイドの機能改修

### 画像表示機能の改修
- **src画像**をクリックすると、**フルサイズの画像**がHTMLの右側に表示されるように改修する。
- **テーブル行**に画像がある場合、クリックすると**フルサイズの画像**がHTML右側に表示されるように改修する。
- 起動・停止・再起動ボタン押下時、特定せるの文字列を一定時間(10秒程度)点滅させる処理を追加
- 起動・停止・再起動ボタン押下時、その行のボタンすべてを一定時間(10秒程度)、disebledにする処理を追加
  （意図しないエラーを未然防止目的）
- フィルタ機能の追加　officeNameでプルダウン選択、選択したもののみ表示する機能
- キャプチャーがエラーで止まった場合は、クライアント側でrunningのままになってしまうので、
  何か違うステータスを表示するよう改修する

### 状況表示機能
- クライアント側のHTMLに、**稼働している`キャプチャー`の総数**と**停止している数**のサマリーを表示する。
- クライアント側のHTMLに、サーバー側（ホスト名`xxxxxx`）の**メモリ**と**CPU使用率**をリアルタイムで表示する。

### エラーハンドリングの強化
- クライアントからHTTPサーバーに接続できな場合、「メンテナンス中です」等のメッセージを表示する。

### コマンド実行履歴の管理
- ブラウザからの**開始・停止・再起動**などのコマンド実行履歴をDBに登録し、WebSocketを使って各クライアントに配信する。

### 新規登録時のデフォルト設定
- クライアント側からアカウントの**新規登録**を行う際、**デフォルト入力値**として以下項目を表示する：
  - `zoomlevel`を1
  - `width` 1920
  - `height` 1080

### アカウント管理
- クライアント側からアカウントを削除する際、再確認用の**アラート**を設ける。

---

## 3. データベース（MongoDB）の管理

### エラーログの管理
- サーバー側で捕捉したエラーをMongoDBにエラーログとして保存。
- MongoDBに登録している**30日以上経過した過去エラーログ**を定期的に削除するロジックを構築。

### バックアップおよびリストア
- **MongoDBのバックアップ**手法の確立。
- **MongoDBのリストア**手法の確立。
- **MongoDBの定期バックアップ**を自動的に実行する仕組みを構築。

---

## 4. コードの保守性向上

### コードの命名規則
- サーバーサイド・クライアントサイドのコードにおいて、変数名・オブジェクト名、関数名を現在の運用に関連する名称に修正する。

---

## 5. ドキュメント作成

### 構築手順書
- プロジェクトの構築手順書を**`ReadMe.md`**ファイルとして作成する。

---