
require("sdk/libs/strophe");
let WebIM = require("utils/WebIM")["default"];
let msgStorage = require("comps/chat/msgstorage");
let msgType = require("comps/chat/msgtype");
let ToastPannel = require("./comps/toast/toast");
let disp = require("utils/broadcast");

// 每次接受信息都需要判断下对方是不是我的好友，不是的话就把信息缓存起来，当做是好友
function addFriend(data){
  let member = wx.getStorageSync('member')||[];

  let arr=member.filter(i=>{
    return i.name==data.from;
  })
  if (arr.length<=0){
    member.push({ "groups": [], "name": data.from, "subscription": "both", "jid": "" })
    wx.setStorageSync("member", member)
  }
}


function ack(receiveMsg){
	// 处理未读消息回执
	var bodyId = receiveMsg.id;         // 需要发送已读回执的消息id
	var ackMsg = new WebIM.message("read", WebIM.conn.getUniqueId());

  console.log('ackMsg', ackMsg)
	ackMsg.set({
		id: bodyId,
		to: receiveMsg.from
	});
	WebIM.conn.send(ackMsg.body);
}

function onMessageError(err){
	if(err.type === "error"){
		wx.showToast({
			title: err.errorText
		});
		return false;
	}
	return true;
}

function getCurrentRoute(){
	let pages = getCurrentPages();
	let currentPage = pages[pages.length - 1];
	return currentPage.route;
}

function calcUnReadSpot(message){
	let myName = wx.getStorageSync("myUsername");
	let members = wx.getStorageSync("member") || []; //好友
	var listGroups = wx.getStorageSync('listGroup')|| []; //群组
	let allMembers = members.concat(listGroups)
	let count = allMembers.reduce(function(result, curMember, idx){
		let chatMsgs;
		if (curMember.roomId) {
			chatMsgs = wx.getStorageSync(curMember.roomId + myName.toLowerCase()) || [];
		}else{
			chatMsgs = wx.getStorageSync(curMember.name.toLowerCase() + myName.toLowerCase()) || [];
		}
		
		return result + chatMsgs.length;
	}, 0);
	getApp().globalData.unReadMessageNum = count;
	disp.fire("em.xmpp.unreadspot", message);
}

App({
	ToastPannel,
	globalData: {
		unReadMessageNum: 0,
		userInfo: null,
		saveFriendList: [],
		saveGroupInvitedList: [],
		isIPX: false //是否为iphone X
	},

	conn: {
		closed: false,
		curOpenOpt: {},
		open(opt){
			wx.showLoading({
			  	title: '正在初始化客户端...',
			  	mask: true
			})
			this.curOpenOpt = opt;
			WebIM.conn.open(opt);
			this.closed = false;
		},
		reopen(){
			if(this.closed){
				//this.open(this.curOpenOpt);
				WebIM.conn.open(this.curOpenOpt);
				this.closed = false;
			}
		}
	},
	onLaunch(){
		// 调用 API 从本地缓存中获取数据
		var me = this;
		var logs = wx.getStorageSync("logs") || [];
		logs.unshift(Date.now());
		wx.setStorageSync("logs", logs);


		// 
		disp.on("em.main.ready", function(){
			calcUnReadSpot();
		});
		disp.on("em.chatroom.leave", function(){
			calcUnReadSpot();
		});
		disp.on("em.chat.session.remove", function(){
			calcUnReadSpot();
		});
		disp.on('em.chat.audio.fileLoaded', function(){
			calcUnReadSpot()
		});

		// 
		WebIM.conn.listen({
			onOpened(message){
				WebIM.conn.setPresence();
				if(getCurrentRoute() == "pages/login/login" || getCurrentRoute() == "pages/login_token/login_token"){
					me.onLoginSuccess(wx.getStorageSync("myUsername").toLowerCase());
				}
			},
			onClosed(){
				me.conn.closed = true;
			},
			onInviteMessage(message){
				me.globalData.saveGroupInvitedList.push(message);
				disp.fire("em.xmpp.invite.joingroup", message);
			
			},
			onPresence(message){
				//console.log("onPresence", message);
				switch(message.type){
				case "unsubscribe":
					// pages[0].moveFriend(message);
					break;
				// 好友邀请列表
				case "subscribe":
					if(message.status === "[resp:true]"){

					}
					else{
						// pages[0].handleFriendMsg(message);
						for (let i = 0; i < me.globalData.saveFriendList.length; i ++) {
					      	if(me.globalData.saveFriendList[i].from === message.from){
					      		me.globalData.saveFriendList[i] = message
					      		disp.fire("em.xmpp.subscribe");
					      		return;
					 		}
					    }
						me.globalData.saveFriendList.push(message);
						disp.fire("em.xmpp.subscribe");
					}
					break;
				case "subscribed":
					wx.showToast({
						title: "添加成功",
						duration: 1000
					});
					break;
				case "unsubscribed":
					break;
				case "memberJoinPublicGroupSuccess":
					wx.showToast({
						title: "已进群",
						duration: 1000
					});
					break;
				case "unavailable":
					disp.fire("em.xmpp.contacts.remove", message);
					break;
				default:
					break;
				}
			},
			onAudioMessage(message){
				console.log("onAudioMessage", message);
        addFriend(message)
				if(message){
					if(onMessageError(message)){
						msgStorage.saveReceiveMsg(message, msgType.AUDIO);
					}
					calcUnReadSpot(message);
					ack(message);
				}
			},
			
			onCmdMessage(message){
				console.log("onCmdMessage", message);
        addFriend(message)
				if(message){
					if(onMessageError(message)){
						msgStorage.saveReceiveMsg(message, msgType.CMD);
					}
					calcUnReadSpot(message);
					ack(message);
				}
			},


			onTextMessage(message){
				console.log("onTextMessage", message);
        // 判断对方在不在我的缓存中，不在的话就把对方加入缓存
        addFriend(message)
				if(message){
					if(onMessageError(message)){
						msgStorage.saveReceiveMsg(message, msgType.TEXT);
					}
          // 计算未读消息数
					calcUnReadSpot(message);
					ack(message);
				}
			},

			onEmojiMessage(message){
				console.log("onEmojiMessage", message);
        addFriend(message)
				if(message){
					if(onMessageError(message)){
						msgStorage.saveReceiveMsg(message, msgType.EMOJI);
					}
					calcUnReadSpot(message);
					ack(message);
				}
			},

			onPictureMessage(message){
				console.log("onPictureMessage", message);
        addFriend(message)
				if(message){
					if(onMessageError(message)){
						msgStorage.saveReceiveMsg(message, msgType.IMAGE);
					}
					calcUnReadSpot(message);
					ack(message);
				}
			},

			onFileMessage(message){
				console.log('onFileMessage', message);
        addFriend(message)
				if (message) {
					if(onMessageError(message)){
						msgStorage.saveReceiveMsg(message, msgType.FILE);
					}
					calcUnReadSpot(message);
					ack(message);
				}
			},

			// 各种异常
			onError(error){

				// 16: server-side close the websocket connection
				console.log(error)

				if(error.type == WebIM.statusCode.WEBIM_CONNCTION_DISCONNECTED){
					if(WebIM.conn.autoReconnectNumTotal < WebIM.conn.autoReconnectNumMax){
						return;
					}
					wx.showToast({
						title: "server-side close the websocket connection",
						duration: 1000
					});
					wx.redirectTo({
						url: "../login/login"
					});
					return;
				}
				// 8: offline by multi login
				if(error.type == WebIM.statusCode.WEBIM_CONNCTION_SERVER_ERROR){
					wx.showToast({
						title: "offline by multi login",
						duration: 1000
					});
					wx.redirectTo({
						url: "../login/login"
					});
				}
				if(error.type ==  WebIM.statusCode.WEBIM_CONNCTION_OPEN_ERROR){
					wx.hideLoading()
					disp.fire("em.xmpp.error.passwordErr");
					// wx.showModal({
					// 	title: "用户名或密码错误",
					// 	confirmText: "OK",
					// 	showCancel: false
					// });
				}
				if (error.type == WebIM.statusCode.WEBIM_CONNCTION_AUTH_ERROR) {
					wx.hideLoading()
					disp.fire("em.xmpp.error.tokenErr");
				}
			},
		});
		this.checkIsIPhoneX();
	},
	onShow(){
		this.conn.reopen();
	},

	onLoginSuccess: function(myName){
		wx.hideLoading()
		wx.redirectTo({
			url: "../chat/chat?myName=" + myName
		});
	},

	getUserInfo(cb){
		var me = this;
		if(this.globalData.userInfo){
			typeof cb == "function" && cb(this.globalData.userInfo);
		}
		else{
			// 调用登录接口
			wx.login({
				success(){
					wx.getUserInfo({
						success(res){
							me.globalData.userInfo = res.userInfo;
							typeof cb == "function" && cb(me.globalData.userInfo);
						}
					});
				}
			});
		}
	},
	checkIsIPhoneX: function() {
	    const me = this
	    wx.getSystemInfo({
	      	success: function (res) {
		        // 根据 model 进行判断
		        if (res.model.search('iPhone X') != -1) {
		          	me.globalData.isIPX = true
		        }
	      	}
	    })
	},

});
