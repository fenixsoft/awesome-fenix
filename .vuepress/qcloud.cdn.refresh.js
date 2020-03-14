const qcloudSDK = require('qcloud-cdn-node-sdk')

const userConfig = {
  secretId: process.env.CDN_ID,
  secretKey: process.env.CDN_KEY
}
console.log(userConfig)
qcloudSDK.config(userConfig)

qcloudSDK.request('RefreshCdnDir', {
  'dirs.0': 'http://icyfenix.cn'
}, (res) => {
  console.log(res)
})
