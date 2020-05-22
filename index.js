import linebot from 'linebot'
import dotenv from 'dotenv'
import rp from 'request-promise'
// ngrok authtoken 1b9lrgl1tsqi7SVmgWFH1CIjONc_7W9qky1kaudPv1r36PdBG
// ngrok http 8080

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

bot.on('message', async (event) => {
  // 若使用者輸入非文字，不執行函式
  let msg = ''
  console.log(event.message.text)
  if (event.message.type !== 'text') return
  try {
    // 從API 取資料
    const data = await rp({ uri: 'https://recreation.forest.gov.tw/mis/api/BasicInfo/Trail', json: true })
    // 因為要控制回傳的資料，所以定義filterData = 回傳的陣列，後面再選擇要印出filterData 的哪些東西
    // !!! 注意 !!! 使用者查詢要輸入「臺」北、中、南、東，不能用「台」
    const filterData = filter(event.message.text, data)
    if (filterData.length > 0) {
      for (const f in filterData) { }
      // msg = {
      //   type: 'template',
      //   altText: 'sorry 只能在手機上看到喔',
      //   template: {
      //     type: 'carousel',
      // columns: [
      //   {
      //     text: `${filterData[0].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[1].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[2].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[3].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[4].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[5].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[6].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[7].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[8].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   },
      //   {
      //     text: `${filterData[9].TR_CNAME}`,
      //     actions: [
      //       {
      //         type: 'message',
      //         label: '第一個按鈕',
      //         text: '1'
      //       }
      //     ]
      //   }
      // ]
      // }

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
      console.log('成功抓到!')
    }
    if (event.message.text === filterData + 'hi') {
      msg = {
        type: 'location',
        title: '南澳古道',
        address: '南澳南溪產業道路11公里處',
        latitude: 24.4296390405548,
        longitude: 121.691964454609
      }
    }

    // carouesl 模板，最多可以放10 個column，column 的 actions 的數量必須相同，label (按鈕) 最多只能放 3 個
    if (event.message.text === 'ha') {
      msg = {
        type: 'template',
        altText: '在不支援顯示樣板的地方顯示的文字',
        template: {
          type: 'carousel',
          columns: [
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第二組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            },
            {
              text: '第一組標題',
              actions: [
                {
                  type: 'message',
                  label: '第一個按鈕',
                  text: '1'
                }
              ]
            }
          ]
        }
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
    msg = '發生錯誤'
  }
  event.reply(msg)
})

// 監聽機器人的port
bot.listen('/', process.env.PORT, () => {
  console.log('bot launched!!!')
})
