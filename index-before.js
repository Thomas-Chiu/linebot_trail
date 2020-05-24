import linebot from 'linebot'
import dotenv from 'dotenv'
import rp from 'request-promise'
import proj4 from 'proj4'
// ngrok authtoken 1b9lrgl1tsqi7SVmgWFH1CIjONc_7W9qky1kaudPv1r36PdBG
// ngrok http 8080

// 啟用dotenv 套件
dotenv.config()
// 宣告bot 資訊
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

// 定義proj4 參數 (內容包含大地框架、橢球、投影等)，是根據這些參數轉換座標
proj4.defs([
  ['EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
  ['EPSG:3826',
    '+title=TWD97 TM2+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=公尺 +no_defs']
])

// TWD97 轉 WGS84 (經緯度)
const EPSG4326 = new proj4.Proj('EPSG:4326')// WGS84
const EPSG3826 = new proj4.Proj('EPSG:3826')// TWD97
const testing = proj4(EPSG3826, EPSG4326, [231656.0, 2601972])
console.log(testing)
// [250000,2544283.12479424] => [121, 23]

// 宣告filter 函式
const filter = (str, data) => {
  // 空陣列儲存filter 的東西)
  const result = []
  // for of 跑API.data 的json 資料
  for (const d of data) {
    // 因為有幾筆資料的position 是空值，所以要跳過，不然程式會抓不到
    // 若if () 後面只有一行，可不用加大括號 {}
    if (d.TR_POSITION == null) continue
    // 過濾出position 包含str 關鍵字的資料，整包json push 到result 陣列
    else if (d.TR_POSITION.includes(str)) {
      result.push(d)
    }
  }
  return result
}

// bot 執行
bot.on('message', async (event) => {
  let msg = ''
  try {
    console.log(event.message.text)
    // 從API 取資料
    const data = await rp({ uri: 'https://recreation.forest.gov.tw/mis/api/BasicInfo/Trail', json: true })
    if (event.message.type !== 'text') return
    // 因為要控制回傳的資料，所以定義filterData = 回傳的陣列，後面再選擇要印出filterData 的哪些東西；使用者查詢要輸入「臺」北、中、南、東，不能用「台」
    const filterData = filter(event.message.text, data)
    const columnArr = []
    if (filterData.length > 0) {
      for (const f of filterData) {
        // carouesl 模板，最多可以放10 個column，column 的actions 數量必須相同，label(按鈕) 最多只能放 3 個
        const convert = proj4(EPSG3826, EPSG4326, [f.TR_ENTRANCE[0].x, f.TR_ENTRANCE[0].y])
        const column = {
          text: `${f.TR_POSITION}－${f.TR_CNAME}`,
          actions: [{
            type: 'message',
            label: '點我看簡介',
            text: `入口：${f.TR_ENTRANCE[0].memo}\n全長：${f.TR_LENGTH}\n路況：${f.TR_PAVE}\n海拔：${f.TR_ALT_LOW}～${f.TR_ALT}\n路程規劃：${f.TR_TOUR}\n管理單位：${f.TR_ADMIN}\n洽詢電話：${f.TR_ADMIN_PHONE}\n最佳造訪期：${f.TR_BEST_SEASON}\n`
          }, {
            type: 'message',
            label: '點我看位置',
            text: `經度：${convert[0]}\n緯度：${convert[1]}`
            // text: `${f.TR_ENTRANCE[0].x}, ${f.TR_ENTRANCE[0].y}`
          }, {
            type: 'message',
            label: '點我看連結',
            text: f.URL
          }]
        }
        columnArr.push(column)

        console.log('抓到：' + f.TR_CNAME)
      }
      console.log(columnArr)
      msg = {
        type: 'template',
        altText: 'sorry 只能在手機上看到喔',
        template: {
          type: 'carousel',
          columns: columnArr
        }
      }
    }

    //   msg = `
    // ${event.message.text}有${filterData.length}條路線\n
    // 名稱：${filterData[0].TR_CNAME}\n
    // 位置：${filterData[0].TR_POSITION}\n
    // 簡介：${filterData[0].GUIDE_CONTENT}\n
    // 網址：${filterData[0].URL}\n
    // 入口：${filterData[0].TR_ENTRANCE[0].memo}\n
    // 全長：${filterData[0].TR_LENGTH}\n
    // 海拔：${filterData[0].TR_ALT_LOW}～${filterData[0].TR_ALT}\n
    // 路程規劃：${filterData[0].TR_TOUR}\n
    // 管理單位：${filterData[0].TR_ADMIN}\n
    // 洽詢電話：${filterData[0].TR_ADMIN_PHONE}\n
    // 最佳造訪期：${filterData[0].TR_BEST_SEASON}\n
    // `

    if (event.message.text === 'ha') {
      msg = {
        type: 'location',
        title: '步道',
        address: '南澳南溪產業道路11公里處',
        longitude: 121.691964454609,
        latitude: 24.4296390405548
      }
    }

    // buttons 模板，最多可放四個label (按鈕)，不過是直式的
    if (event.message.text === 'he') {
      msg = {
        type: 'template',
        altText: '在不支援顯示樣板的地方顯示的文字',
        template: {
          type: 'buttons',
          text: '標題文字',
          actions: [
            {
              type: 'message',
              label: '第一個按鈕',
              text: '1'
            },
            {
              type: 'message',
              label: '第二個按鈕',
              text: '2'
            },
            {
              type: 'message',
              label: '第三個按鈕',
              text: '3'
            },
            {
              type: 'message',
              label: '第四個按鈕',
              text: '4'
            }
          ]
        }
      }
    }
  } catch (error) {
    msg = error.type + error.message
  }
  event.reply(msg)
})

// 監聽機器人的port
bot.listen('/', process.env.PORT, () => {
  console.log('bot launched!!!')
})
