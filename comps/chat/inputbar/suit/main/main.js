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
		inputMessage: "",		// render input 的值
		userMessage: "",		// input 的实时值
	},

	methods: {
		focus(){
			this.triggerEvent("inputFocused", null, { bubbles: true });
		},

		blur(){
			this.triggerEvent("inputBlured", null, { bubbles: true });
		},

		isGroupChat(){
			return this.data.chatType == msgType.chatType.CHAT_ROOM;
		},

		getSendToParam(){
			return this.isGroupChat() ? this.data.username.groupId : this.data.username.your;
		},

		// bindinput 不能打冒号！
		bindMessage(e){
			this.setData({
				userMessage: e.detail.value
			});
		},

		emojiAction(emoji){
			var str;
			var msglen = this.data.userMessage.length - 1;
			if(emoji && emoji != "[del]"){
				str = this.data.userMessage + emoji;
			}
			else if(emoji == "[del]"){
				let start = this.data.userMessage.lastIndexOf("[");
				let end = this.data.userMessage.lastIndexOf("]");
				let len = end - start;
				if(end != -1 && end == msglen && len >= 3 && len <= 4){
					str = this.data.userMessage.slice(0, start);
				}
				else{
					str = this.data.userMessage.slice(0, msglen);
				}
			}
			this.setData({
				userMessage: str,
				inputMessage: str
			});
		},

		sendMessage(){
			if(!this.data.userMessage.trim()){
				return;
			}
			let id = WebIM.conn.getUniqueId();
			let msg = new WebIM.message(msgType.TEXT, id);
      let that=this;
			msg.set({
        msg: this.data.userMessage,
				from: this.data.username.myName,
				to: this.getSendToParam(),
				roomType: false,
				chatType: this.data.chatType,
        ext: {
          'userAlias':'我是14啊',
          'userAvatar':'https://ss0.baidu.com/73F1bjeh1BF3odCf/it/u=833172462,845195358&fm=85&s=5210E02B96E0730112B0E5EE0300F021',
          'merchantId':1
        },
				success(id, serverMsgId){
          console.log('-------------------------');
          console.log(that.data.username.myName, that.getSendToParam());
          console.log('-------------------------');
				}
			});
			if(this.data.chatType == msgType.chatType.CHAT_ROOM){
				msg.setGroup("groupchat");
			}
			WebIM.conn.send(msg.body);
			this.triggerEvent(
				"newTextMsg",
				{
					msg: msg,
					type: msgType.TEXT,
				},
				{
					bubbles: true,
					composed: true
				}
			);
			//
			this.setData({
				userMessage: "",
				inputMessage: "",
			});
		},
	},

	// lifetimes
	created(){},
	attached(){},
	moved(){},
	detached(){},
	ready(){},
});
