let WebIM = require("../../../../../utils/WebIM")["default"];
let msgType = require("../../../msgtype");

Component({
  properties: {
    username: {
      type: Object,
      value: {},
    },
    chatType: {
      type: String,
      value: msgType.chatType.SINGLE_CHAT,
    },
  },
  data: {

  },
  methods: {
    openCamera() {
      var me = this;
      wx.chooseImage({
        count: 1,
        sizeType: ["original", "compressed"],
        sourceType: ["camera"],
        success(res) {
          me.upLoadImage(res);
        }
      });
    },

    sendImage() {
      var me = this;
      wx.chooseImage({
        count: 1,
        sizeType: ["original", "compressed"],
        sourceType: ["album"],
        success(res) {
          me.upLoadImage(res);
        },
      });
    },

    isGroupChat() {
      return this.data.chatType == msgType.chatType.CHAT_ROOM;
    },

    getSendToParam() {
      return this.isGroupChat() ? this.data.username.groupId : this.data.username.your;
    },

    upLoadImage(res) {
      var me = this;
      var tempFilePaths = res.tempFilePaths;
      wx.getImageInfo({
        src: res.tempFilePaths[0],
        success(res) {
          var allowType = {
            jpg: true,
            gif: true,
            png: true,
            bmp: true
          };
          var str = WebIM.config.appkey.split("#");
          var width = res.width;
          var height = res.height;
          var index = res.path.lastIndexOf(".");
          var filetype = (~index && res.path.slice(index + 1)) || "";
          if (filetype.toLowerCase() in allowType) {
            wx.uploadFile({
              url: "https://a1.easemob.com/" + str[0] + "/" + str[1] + "/chatfiles",
              filePath: tempFilePaths[0],
              name: "file",
              header: {
                "Content-Type": "multipart/form-data"
              },
              success(res) {
                var data = res.data;
                var dataObj = JSON.parse(data);
                var id = WebIM.conn.getUniqueId(); // 生成本地消息 id
                var msg = new WebIM.message(msgType.IMAGE, id);
                var file = {
                  type: msgType.IMAGE,
                  size: {
                    width: width,
                    height: height
                  },
                  url: dataObj.uri + "/" + dataObj.entities[0].uuid,
                  filetype: filetype,
                  filename: tempFilePaths[0]
                };
                msg.set({
                  apiUrl: WebIM.config.apiURL,
                  body: file,
                  from: me.data.username.myName,
                  to: me.getSendToParam(),
                  ext: {
                    'userAlias': '我是14啊',
                    'userAvatar': 'https://ss0.baidu.com/73F1bjeh1BF3odCf/it/u=833172462,845195358&fm=85&s=5210E02B96E0730112B0E5EE0300F021',
                    'merchantId':1
                  },
                  roomType: false,
                  chatType: me.data.chatType,
                });
                if (me.data.chatType == msgType.chatType.CHAT_ROOM) {
                  msg.setGroup("groupchat");
                }
                WebIM.conn.send(msg.body);
                me.triggerEvent(
                  "newImageMsg", {
                    msg: msg,
                    type: msgType.IMAGE
                  }, {
                    bubbles: true,
                    composed: true
                  }
                );
              }
            });
          }
        }
      });
    },
  },
});