import MsgObject from './Entity/msg';

export default class WebQQ {
  constructor(){
    this.mq = null;
    this.msgId = 0;
    this.friendMsgs = [];
    this.groupMsgs = [];
    this.msgs = []; // 存放所有消息，原始对象
    this.formatMsgs = []; // 存放所有消息， 格式化过的对象
    this.friends = [];
    this.groups = [];
    this.registerMq();
  }

  registerMq(){
    // let frame = window.document.getElementById("webqq");
    // this.mq = frame && frame.contentWindow.mq;
    // this.mq = window.mq;
    let w = chrome.app.window.getAll()[0];
    this.mq = w && w.contentWindow.mq;
    if(!this.mq){
      setTimeout(this.registerMq.bind(this), 100);
    }
    else{
        this.registerAddFriend.call(this);
        this.registerAddGroup.call(this);
        this.registerFriendMsg.call(this);
        this.registerGroupMsg.call(this);
    }
  }

  registerAddFriend(){
    let _oldAddFriend = this.mq.model.buddylist.addFriend;
    this.mq.model.buddylist.addFriend = (friend)=>{
      if(!this.getFriendByUin(friend.uin)){
        _oldAddFriend(friend);
        this.friends.push(friend);
        friend.ruin = 0;
        // this.sendGetFriendUin(friend.uin);
      }
    };
  }
  registerAddGroup() {
    let _oldAddGroup = this.mq.model.buddylist.addGroup;
    this.mq.model.buddylist.addGroup = (group)=> {
      if (!this.getGroupByUin(group.gid)) {
        _oldAddGroup(group);
        this.mq.model.buddylist.getGroupInfoList(group.code);
        this.groups.push(group);
        this.getGroupRuin(group.code);
      }
    };
  }

  // 通用新消息处理
  __addMessage(uin, msg, msgPool, oldAddMessage){
    oldAddMessage(uin, msg);
    if (typeof(msg.sender.isSelf) !== "undefined" && msg.sender.isSelf){
      return;
    }
    this.msgs.push(msg);
    msgPool.push(msg);
  }

  // 好友消息
  registerFriendMsg() {
      let oldAddMessage = this.mq.model.chat.addMessage;
      this.mq.model.chat.addMessage = (uin, msg)=> {

      msg.msgType = "FriendMsg";
      let msgObject = new MsgObject();
      msgObject.Event = msg.msgType;
      msgObject.Data.Sender = uin;
      msgObject.Data.SendTime = Math.ceil(msg.time / 1000);
      msgObject.Data.Message = msg.content[1];
      this.formatMsgs.push(msgObject);
      this.__addMessage(uin, msg, this.friendMsgs, oldAddMessage);
    };
  }
  // 群消息
  registerGroupMsg(){
    let oldAddGroupMessage = this.mq.model.chat.addGroupMessage;
    this.mq.model.chat.addGroupMessage =(uin ,msg)=>{
      //console.log(msg.sender.isSelf);
      msg.msgType = "GroupMsg";
      let msgObject = new MsgObject();
      msgObject.Event = msg.msgType;
      msgObject.Data.GroupQQ = this.getGroupByUin(uin).ruin;
      msgObject.Data.ClusterNum = msg.from_uin;
      msgObject.Data.Sender = msg.sender_uin;
      msgObject.Data.SenderQQ = msg.sender.ruin;
      msgObject.Data.SendTime = Math.ceil(msg.time / 1000);
      msgObject.Data.Message = msg.content[1]
      this.formatMsgs.push(msgObject);
      this.__addMessage(uin, msg, this.groupMsgs, oldAddGroupMessage);
    };
  }

  // 发送群消息
  sendGroupMsg(uin, msg) {
    let h = {content:"[\""+ msg + "\",[\"font\",{\"name\":\"宋体\",\"size\":10,\"style\":[0,0,0],\"color\":\"000000\"}]]", group_uin: uin, face:534};
    let sendGroupMsgTryCount = 0;
    h.clientid = this.mq.clientid;
    h.msg_id = this.msgId;
    this.msgId++;
    h.psessionid = this.mq.psessionid;
    this.mq.rpcService.require({
        url: "http://d.web2.qq.com/channel/send_qun_msg2",
        https: this.mq.setting.enableHttps,
        param: h,
        withCredentials: true,
        method: "POST",
        onSuccess: (data)=>{
            // console.log(data);
            if (data.retcode){
                setTimeout(function () {
                    sendGroupMsgTryCount += 1;
                    if (sendGroupMsgTryCount > 5){
                        sendGroupMsgTryCount = 0;
                        return
                    }
                    this.sendGroupMsg(uin, msg);
                }, 500);
            }
        }
    })

  };

    // 发送好友消息
    sendBuddyMsg(uin, msg){
        this.mq.model.chat.sendMsg({content:"[\""+ msg + "\",[\"font\",{\"name\":\"宋体\",\"size\":10,\"style\":[0,0,0],\"color\":\"000000\"}]]", to: uin, face:534});
    }
  // 获取群号
  getGroupRuin(gcode){
    this.mq.rpcService.require({
      url: "http://s.web2.qq.com/api/get_friend_uin2",
      method: "GET",
      param: {tuin: gcode, type: 1, vfwebqq: this.mq.vfwebqq},
      withCredentials: true,
      onSuccess: function(N) {
        _g = this.groups.filter(function(g){
          return g.code === N.result.uin;
        });
        _g[0].ruin = N.result.account;
      }
    })
  }

  getGroupByUin(uin){
    let g = this.groups.filter(function(g){
      return g.gid === uin;
    });
    if (g.length > 0){
      return g[0];
    }
  }

  // 获取真实QQ号，已经废弃了
  sendGetFriendUin = function(uin) {
      let param = {};
      param.tuin = uin; //uin
      param.type = 1;

      param.vfwebqq = this.mq.vfwebqq;
      this.mq.rpcService.require({
          url: this.mq.STATIC_CGI_URL + "api/get_friend_uin2",
          method: "GET",
          param: param,
          withCredentials: true,
          onSuccess: function (data) {
              if (data.retcode === 0) {
                  // console.log(data);
                  // handlers.onGetFriendUinSuccess(data.result);
              }
          }
      })
  }

  getFriendByUin(uin){
    let f = this.friends.filter(function(f){
      return f.uin === uin;
    });
    if (f.length > 0){
      return f[0];
    }
  }
}