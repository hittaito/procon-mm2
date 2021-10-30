# 「マジカルミライ 2021」 プログラミング・コンテスト応募作品

![gif](https://user-images.githubusercontent.com/61876075/134759913-65701e64-a423-4833-a918-2caf8b33865c.gif)

## 作品

https://hittaito.github.io/procon-mm2/

## 動作

動かすためには TextAlive のアプリトークンが必要です。  
[TextAlive 開発者情報ページ](https://developer.textalive.jp/profile/)

```
// 初めに
cp .env.example .env
vi .env              <-- TextAlive 用TOKENを記入
npm install

// 開発 port=11234
npm run dev

// ビルド(./distに出力されます)
npm run build
```

## 注意点

WebGL2.0 を使用しています。また、拡張機能[EXT_color_buffer_float](https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float)を使用しており、両方有効でないと動作しません。  
最新の Safari(15, iPad)で動作したので、とりあえず大丈夫だとは思いますが、14 では動きません。

## 簡易説明

左下の”START”ボタンで開始します。（ロードしてからすぐ押すと動かないですが。。）  
シークバーで再生位置を変更します。  
トグルで背景のアニメーションを変えます。最初はマウス、タップ位置から文字が出てくる表現。オンにすると背景が移動するようになり、マウス、タップ位置の方向に移動していきます。  
全画面ボタンで全画面表示になります。これは全画面表示に対応しているブラウザのみ表示されます。

## 参考 URL

### テキスト表現(文字のアウトラインやエフェクト部分)

-   https://qiita.com/uctakeoff/items/387f2271befb81734d18
-   https://qiita.com/gam0022/items/f3b7a3e9821a67a5b0f3

### 背景表現

-   https://gpfault.net/posts/webgl2-particles.txt.html
-   https://wgld.org/d/webgl2/w015.html
-   https://tkmh.me/blog/2016/12/06/588/
