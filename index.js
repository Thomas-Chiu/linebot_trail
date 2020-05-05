import linebot from 'linebot'
import dotenv from 'dotenv'
import rp from 'request-promise'

// 啟用dotenv 套件
dotenv.config()

// 宣告機器人資訊
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

// 宣告一個過濾的函式
const filter = (str, data) => {
  // 空陣列 (建立容器儲存filter 回傳的東西)
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
  // 回傳陣列
  return result
}

// 機器人要做的(函式)事情
bot.on('message', async (event) => {
  // 多一行判斷，若使用者輸入非文字，不執行函式
  if (event.message.type !== 'text') return
  let msg = ''
  let filternum = 0
  console.log(event.message.text)
  try {
    // 從API 取資料
    const data = await rp({ uri: 'https://recreation.forest.gov.tw/mis/api/BasicInfo/Trail', json: true })
    // 因為要控制回傳的資料，所以定義filterData = 回傳的陣列，後面再選擇要印出filterData 的哪些東西
    // !!! 注意 !!! 使用者查詢要輸入「臺」北、中、南、東，不能用「台」
    const filterData = filter(event.message.text, data)
    console.log(filterData.length)
    // while (filternum > filterData.length) {
    if (filterData.length > 0) {
      msg = `
    ${event.message.text}有${filterData.length}條路線\n
    名稱：${filterData[filternum].TR_CNAME}\n
    位置：${filterData[filternum].TR_POSITION}\n
    簡介：${filterData[filternum].GUIDE_CONTENT}\n
    網址：${filterData[filternum].URL}\n
    入口：${filterData[filternum].TR_ENTRANCE[0].memo}\n
    全長：${filterData[filternum].TR_LENGTH}\n
    海拔：${filterData[filternum].TR_ALT_LOW}～${filterData[filternum].TR_ALT}\n
    路程規劃：${filterData[filternum].TR_TOUR}\n
    管理單位：${filterData[filternum].TR_ADMIN}\n
    洽詢電話：${filterData[filternum].TR_ADMIN_PHONE}\n
    最佳造訪期：${filterData[filternum].TR_BEST_SEASON}\n
    `
      filternum++
      console.log('成功抓到!')
      console.log(filternum)
    }
    // }
  } catch (error) {
    msg = '發生錯誤'
  }
  event.reply(msg)
})

// 監聽機器人的port
bot.listen('/', process.env.PORT, () => {
  console.log('bot launched!!!')
})
