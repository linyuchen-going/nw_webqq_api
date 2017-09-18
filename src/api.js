import WebQQ from './webqq';
import Express from 'express';

let webqq = new WebQQ();
window.webqq = webqq;
let httpserver = new Express();

// 获取全部消息
httpserver.get("/msgs", function(req, res){
    res.send(JSON.stringify({data: webqq.formatMsgs}));
    webqq.formatMsgs = [];
});

// 获取好友列表
httpserver.get("/friends", function(req, res){
    let friends = {};
    webqq.friends.map(function (f) {
        friends[f.uin + ""] = {uin: f.uin, markName: f.mark, nick: f.nick}
    });
    res.send(JSON.stringify({data:friends}));
});

// 获取所有群及群成员
httpserver.get("/groups", function(req, res){
    let groups= {};
    webqq.groups.map(function (g) {
        let data = {uin: g.gid, name: g.name, mask:g.mask, members: {}};
        groups[g.gid + ""] = data;

        g.members.forEach(function(m){
            let _isAdmin = (m.group.members.filter(function(_m){
                return m.uin === _m.muin;
            })[0].mflag % 2) !== 0;
            let isCreator = g.owner === m.uin;
            data.members[m.uin + ""] = {
                uin: m.uin,
                nick: m.nick, isAdmin: _isAdmin || isCreator,
                status: m.state,
                card: m.cardName ? m.cardName: m.nick,
                isCreator: isCreator
            }
        });
        res.send(JSON.stringify({data: groups}));
    });
    res.send(JSON.stringify({data: groups}));
});

// 发送个人消息
httpserver.get("/send_msg2buddy", function(req, res){
    let uin = parseInt(req.query.uin);
    let msg = req.query.msg;
    webqq.sendBuddyMsg(uin, msg);
    res.send(JSON.stringify({result: "ok"}));
});

// 发送群消息
httpserver.get("/send_msg2group", function(req, res){
    let uin = parseInt(req.query.uin);
    let msg = req.query.msg;
    webqq.sendGroupMsg(uin, msg);
    res.send(JSON.stringify({result: "ok"}));
});

// uin转成真实QQ号
httpserver.get("/uin2number", function(req, res){
    let qq = webqq.friends.filter(function(f){return f.uin === parseInt(req.query.uin)})[0].ruin;
    res.send(JSON.stringify({data:qq || "0"}));
});

// 截图
httpserver.get("/capture", function (req, res) {
    nw.Window.get().capturePage(function (data) {
        res.send(data);
    });
});

// 退出程序
httpserver.get("/quit", function (req, res) {
    nw.App.quit()
});

// 重新加载
httpserver.get("/reload", function (req, res) {
    nw.Window.get().reload()
});

// 监听端口
let port = parseInt(nw.App.argv[0]) || 3000;
httpserver.listen(port);
