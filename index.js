import linebot from 'linebot'
import dotenv from 'dotenv'
import rp from 'request-promise'

dotenv.config()

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.on('message', async (event) => {
  let msg = ''
  try {
    const data = await rp({ uri: 'https://recreation.forest.gov.tw/mis/api/BasicInfo/Trail', json: true })
    for (const d of data) {
      msg += `${d.TRAILID}：${d.TR_CNAME}\n`
    }
  } catch (error) {
    msg = '發生錯誤'
  }
  event.reply(msg)
})

bot.listen('/', process.env.PORT, () => {
  console.log('bot launched!!!')
})
