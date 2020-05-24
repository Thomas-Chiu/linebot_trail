import linebot from 'linebot'
import dotenv from 'dotenv'
import rp from 'request-promise'
import proj4 from 'proj4' // 座標轉換套件
// ngrok authtoken 1b9lrgl1tsqi7SVmgWFH1CIjONc_7W9qky1kaudPv1r36PdBG
// ngrok http 8080
// p.s.使用者查詢要輸入「臺」北、中、南、東，不能用「台」

dotenv.config() // 啟用dotenv (讀取.env 檔)
const bot = linebot({ // 宣告bot 資訊
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

proj4.defs([ // 定義proj4 參數 (內容包含大地框架、橢球、投影等)，是根據這些參數轉換座標
  ['EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
  ['EPSG:3826',
    '+title=TWD97 TM2+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=公尺 +no_defs']
])

// 宣告TWD97 轉 WGS84(經緯度) 函式
const EPSG4326 = new proj4.Proj('EPSG:4326')// WGS84
const EPSG3826 = new proj4.Proj('EPSG:3826')// TWD97
const testing = proj4(EPSG3826, EPSG4326, [231656.0, 2601972])
console.log(testing) // [250000,2544283.12479424] => [121, 23]

// 宣告filter 函式
const filter = (str, data) => {
  const result = [] // result 儲存filter 的東西
  for (const d of data) { // for of 跑API.data 的json 資料
    if (d.TR_POSITION == null) continue // 空值要跳過，不然程式會抓不到；若if () 後面只有一行，可不用加大括號 {}
    else if (d.TR_POSITION.includes(str)) {
      result.push(d) // 篩出position 包含str 的資料，整包json push 到result 陣列
    } else if (d.TR_CNAME.includes(str)) {
      result.push(d)
    }
  } return result
}

// imgUrl 陣列
const imgUrl = []
for (let i = 1; i <= 9; i++) {
  imgUrl.push(`https://recreation.forest.gov.tw/Files/RT/index/00${i}.jpg`)
}
for (let i = 10; i <= 99; i++) {
  imgUrl.push(`https://recreation.forest.gov.tw/Files/RT/index/0${i}.jpg`)
}
for (let i = 100; i <= 212; i++) {
  imgUrl.push(`https://recreation.forest.gov.tw/Files/RT/index/${i}.jpg`)
} console.log(imgUrl[211]) // 這是imgUrl 陣列最後一張

// 當使用者輸入訊息
bot.on('message', async (event) => {
  let msg = ''
  try {
    const data = await rp({ uri: 'https://recreation.forest.gov.tw/mis/api/BasicInfo/Trail', json: true }) // 從API 取資料
    const filterData = filter(event.message.text, data) // filterData = filter 後的陣列，再選擇要印出filterData 的哪些東西
    const columnArr = [] // 存column 用的
    console.log(event.message.text, event.message.type)
    // if (event.message.type !== 'text') return  若使用者輸入非文字，不執行函式
    if (filterData.length === 0) { // 若使用者亂打字，如符號或數字，或沒有搜尋到資料
      event.reply(`sorry「${event.message.text}」好像沒有資料喔`)
      // 不知道為啥 msg = '請輸入關鍵字查詢喔' 跑不出來，clg(msg) 有，但line 沒訊息
      // console.log(msg)
    }
    if (event.message.type !== 'text') { // 若使用者傳貼圖
      msg = {
        type: 'sticker',
        packageId: '1',
        stickerId: Math.round(Math.random() * 17) // 目前貼圖可使用1~ 17
      }
    }
    if (event.message.type === 'text') {
      for (const f of filterData) {
        if (f.TR_ENTRANCE[0].x === null || f.TR_ENTRANCE[0].y === null) continue // 跳過空值
        const convert = proj4(EPSG3826, EPSG4326, [f.TR_ENTRANCE[0].x, f.TR_ENTRANCE[0].y]) // 座標轉換
        const column = { // 每個column 都是一個步道
          thumbnailImageUrl: imgUrl[f.TRAILID - 1],
          title: f.TR_CNAME,
          text: f.TR_POSITION,
          actions: [{
            type: 'message',
            label: '點我看簡介',
            text: `－${f.TR_CNAME}－\n\n入口：${f.TR_ENTRANCE[0].memo}\n全長：${f.TR_LENGTH}\n路況：${f.TR_PAVE}\n海拔：${f.TR_ALT_LOW}～${f.TR_ALT}\n路程規劃：${f.TR_TOUR}\n管理單位：${f.TR_ADMIN}\n洽詢電話：${f.TR_ADMIN_PHONE}\n最佳造訪期：${f.TR_BEST_SEASON}\n`
          }, {
            type: 'postback',
            label: '點我看位置',
            data: convert[0] + '\n' + convert[1]
          }, {
            type: 'uri',
            label: '點我看連結',
            uri: f.URL
          }]
        }
        columnArr.push(column) // push 進columnArr 陣列
        console.log('抓到：' + f.TR_CNAME)
        console.log(columnArr.length)
      }
      if (columnArr.length > 10) { // 若回傳超過10 個步道
        msg = `sorry「${event.message.text}」超過10筆資料，請縮小範圍喔`
      } else {
        msg = {
          type: 'template',
          altText: 'sorry 只能在手機上看到喔',
          template: {
            type: 'carousel', // carouesl 模板，最多放10 個column，actions 數量必須相同，最多放3 個
            columns: columnArr
          }
        }
      }
    }
  } catch (error) {
    console.log(error.type, error.message) // clg 錯誤類型和訊息
  }
  event.reply(msg)
})

// 當使用者點擊(點我看位置)按鈕
bot.on('postback', event => {
  const coordinate = event.postback.data.split('\n')
  console.log(coordinate[0], coordinate[1]) // 經度 & 緯度
  event.reply({
    type: 'location',
    title: '步道位置',
    address: `${coordinate[0]}\n${coordinate[1]}`,
    longitude: coordinate[0],
    latitude: coordinate[1]
  })
})

// 監聽機器人的port
bot.listen('/', process.env.PORT, () => {
  console.log('bot launched!!!')
})
