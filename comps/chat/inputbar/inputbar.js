let RecordStatus = require("suit/audio/record_status").RecordStatus;
let msgType = require("../msgtype");

Component({
  properties: {
    username: {
      type: Object,
      value: {}
    },
    chatType: {
      type: String,
      value: msgType.chatType.SINGLE_CHAT,
    },
  },
  data: {
    recordStatus: RecordStatus.HIDE,
    RecordStatus,
    __comps__: {
      main: null,
      emoji: null,
      image: null,
      location: null,
      //video: null,
    },
    iconUrl: 'https://sz-account-header-pic.oss-cn-shenzhen.aliyuncs.com/',
  },
  methods: {
    // 事件有长度限制：仅限 26 字符
    toggleRecordModal() {
      wx.getSetting({
        success: res => {
          // 判断用户有没有授权录音
          if (res.authSetting['scope.record'] == undefined) {
            wx.authorize({
              scope: 'scope.record',
              success: res=>{
                this.triggerEvent("tapSendAudio", null, {
                  bubbles: true,
                  composed: true
                });
              },
              fail:res=>{
                // 拒绝授权
                wx.showToast({
                  title: '拒绝授权无法录音',
                  icon:'none'
                })
              },
            })
          }
          else if (res.authSetting['scope.record']) {
            this.triggerEvent("tapSendAudio", null, {
              bubbles: true,
              composed: true
            });
          } else {
            // 没有授权打开授权
            wx.openSetting({})
          }
        }
      })
    },
    // sendVideo(){
    // 	this.data.__comps__.video.sendVideo();
    // },

    openCamera() {
      this.data.__comps__.image.openCamera();
    },

    openEmoji() {
      this.data.__comps__.emoji.openEmoji();
      this.setData({
        flagBottom: false
      });
    },

    cancelEmoji() {
      this.setData({
        flagBottom: false
      });
      this.data.__comps__.emoji.cancelEmoji();
    },

    sendImage() {
      this.data.__comps__.image.sendImage();
    },

    sendLocation() {
      // this.data.__comps__.location.sendLocation();
    },

    emojiAction(evt) {
      this.data.__comps__.main.emojiAction(evt.detail.msg);
    },
    // 点击切换显示隐藏底部
    clickAdd() {
      this.setData({
        flagBottom: !this.data.flagBottom
      });
      // 关闭掉表情
      this.data.__comps__.emoji.cancelEmoji();
      // 给父元素传递
      this.triggerEvent('showBottom', {
        showBottom: this.data.flagBottom
      })
    },
  },

  // lifetimes
  created() { },
  attached() { },
  moved() { },
  detached() { },
  ready() {
    this.setData({
      isIPX: getApp().globalData.isIPX
    })
    let comps = this.data.__comps__;
    comps.main = this.selectComponent("#chat-suit-main");
    comps.emoji = this.selectComponent("#chat-suit-emoji");
    comps.image = this.selectComponent("#chat-suit-image");
    // comps.location = this.selectComponent("#chat-suit-location");
    //comps.video = this.selectComponent("#chat-suit-video");
  },
});