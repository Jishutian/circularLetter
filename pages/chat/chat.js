let disp = require("../../utils/broadcast");
var WebIM = require("../../utils/WebIM")["default"];
let isfirstTime = true
Page({
	data: {
		search_btn: true,
		search_chats: false,
		yourname: "",
		unReadSpotNum: 0,
		unReadNoticeNum: 0,
		messageNum: 0,
		unReadTotalNotNum: 0,
		arr: [],
		show_clear: false
	},

	onLoad(){
		let me = this;
		//监听加好友申请
		disp.on("em.xmpp.subscribe", function(){
      console.log(11111)
			me.setData({
				messageNum: getApp().globalData.saveFriendList.length,
				unReadTotalNotNum: getApp().globalData.saveFriendList.length + getApp().globalData.saveGroupInvitedList.length
			});
		});

		//监听未读消息数
		disp.on("em.xmpp.unreadspot", function(message){
			me.setData({
				arr: me.getChatList(),
				unReadSpotNum: getApp().globalData.unReadMessageNum > 99 ? '99+' : getApp().globalData.unReadMessageNum,
			});
		});

		//监听未读加群“通知”
		disp.on("em.xmpp.invite.joingroup", function(){
			me.setData({
				unReadNoticeNum: getApp().globalData.saveGroupInvitedList.length,
				unReadTotalNotNum: getApp().globalData.saveFriendList.length + getApp().globalData.saveGroupInvitedList.length
			});
		});
	},

	getChatList(){
		var array = [];
		var member = wx.getStorageSync("member");
		var myName = wx.getStorageSync("myUsername");
    console.log("member",member)
		for(let i = 0; i < member.length; i++){
			let newChatMsgs = wx.getStorageSync(member[i].name + myName) || [];
			let historyChatMsgs = wx.getStorageSync("rendered_" + member[i].name + myName) || [];
			let curChatMsgs = historyChatMsgs.concat(newChatMsgs);
			if(curChatMsgs.length){
				let lastChatMsg = curChatMsgs[curChatMsgs.length - 1];
				lastChatMsg.unReadCount = newChatMsgs.length;
				if(lastChatMsg.unReadCount > 99) {
					lastChatMsg.unReadCount = "99+";
				}
				let dateArr = lastChatMsg.time.split(' ')[0].split('-')
				let timeArr = lastChatMsg.time.split(' ')[1].split(':')
				lastChatMsg.dateTimeNum = `${dateArr[1]}${dateArr[2]}${timeArr[0]}${timeArr[1]}${timeArr[2]}`
				lastChatMsg.time = `${dateArr[1]}月${dateArr[2]}日 ${timeArr[0]}时${timeArr[1]}分`
				array.push(lastChatMsg);
			}
		}
		array.sort((a, b) => {
			return b.dateTimeNum - a.dateTimeNum
		})
    console.log("array", array)
		return array;
	},

	onShow: function(){
		this.setData({
			arr: this.getChatList(),
			unReadSpotNum: getApp().globalData.unReadMessageNum > 99 ? '99+' : getApp().globalData.unReadMessageNum,
			messageNum: getApp().globalData.saveFriendList.length,
			unReadNoticeNum: getApp().globalData.saveGroupInvitedList.length,
			unReadTotalNotNum: getApp().globalData.saveFriendList.length + getApp().globalData.saveGroupInvitedList.length
		});

		if (getApp().globalData.isIPX) {
			this.setData({
				isIPX: true
			})
		}
	},

	tab_contacts: function(){
		wx.redirectTo({
			url: "../main/main?myName=" + wx.getStorageSync("myUsername")
		});
	},


	tab_setting: function(){
		wx.redirectTo({
			url: "../setting/setting"
		});
	},

	tab_notification: function(){
		wx.redirectTo({
			url: "../notification/notification"
		});
	},

	into_chatRoom: function(event){
		let detail = event.currentTarget.dataset.item;
		if (detail.chatType == 'groupchat' || detail.chatType == 'chatRoom') {
			this.into_groupChatRoom(detail)
		} else {
			this.into_singleChatRoom(detail)
		}
	},

	//	单聊
	into_singleChatRoom: function(detail){
		var my = wx.getStorageSync("myUsername");
		var nameList = {
			myName: my,
			your: detail.username
		};
		wx.navigateTo({
			url: "../chatroom/chatroom?username=" + JSON.stringify(nameList)
		});
	},


	del_chat: function(event){
		let detail = event.currentTarget.dataset.item;
		let nameList;
		if (detail.chatType == 'groupchat' || detail.chatType == 'chatRoom') {
			nameList = {
				your: detail.info.to
			};
		} else {
			nameList = {
				your: detail.username
			};
		}

		var myName = wx.getStorageSync("myUsername");
		var currentPage = getCurrentPages();
		
		wx.showModal({
			title: "删除该聊天记录",
			confirmText: "删除",
			success: function(res){
				if(res.confirm){
					wx.setStorageSync(nameList.your + myName, "");
					wx.setStorageSync("rendered_" + nameList.your + myName, "");
					if(currentPage[0]){
						currentPage[0].onShow();
					}
					disp.fire("em.chat.session.remove");
				}
			},
			fail: function(err){
			}
		});
	},

});
