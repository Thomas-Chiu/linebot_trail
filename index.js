import linebot from 'linebot'
import dotenv from 'dotenv'
// import rp from 'request-promise'

dotenv.config()

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.on('message', event => {
  if (event.message.type === 'text') {
    // clg 的內容會顯示在terminal
    console.log(event)
    event.reply(event.message.text)
  }
})

bot.listen('/', process.env.PORT, () => {
  console.log('bot launched!!!')
})
