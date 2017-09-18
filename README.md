# NW_WebQQ_API

NW.js(NodeWebkit)封装的WebQQApi

======================

## 编译

直接`npm run build`即可, 会在build文件夹下生成index.html和index.js

## 运行

直接用NW.js运行本项目即可, 运行时可加一个命令参数**端口号**指定绑定的端口，端口默认为3000

也可将`build/`下的所有文件和项目下的`package.json`单独拎出来组成一个NW.js项目


## 接口

**所有接口的调用方法都是GET**

host: localhost:3000

### 获取消息

url: `/msgs`

response:

```javascript

{
    data:
    [
        {
            Event:"FriendMsg",  // 消息类型
            Data:
            {
                Sender:3021565570,  // 好友临时QQ号(uin)
                SendTime:1505743465, 
                Message:"一条消息"
            }
        },
        {
            Event: "GroupMsg", // 群消息
            Data:
            {
                ClusterNum: 12345678,  // 临时群号(uin)
                Sender: 213213213,  // 发送此消息的群员临时QQ号
                SendTime:1505743465, 
                Message:"一条消息"
            }
        }
     ]
}

```


### 获取好友列表

url: `/friends`

response:

```javascript


{
    data:
    {
        292388634:
        {
            uin:292388634, // 好友临时QQ号
            markName:"备注",
            nick: "昵称"
        }
    }
}
```


### 获取群列表

url: `/groups`

response:
```javascript
{
    data:
    {
        1665276990:
        {
            uin:1665276990, // 临时群号
            name:"机器人test",  // 群名
            mask:0, // 接受群消息设置
            members: // 群成员
            {
                292388634:
                {
                    uin:292388634,
                    nick:"群成员昵称",
                    isAdmin:false,  // 是否是群管理员
                    status:"offline",  // 在线状态
                    card:"群名片",
                    isCreator:false  // 是否是群主
                }
            }
        }
    }
}

```


### 发送好友消息

url: `/send_msg2buddy?uin={uin}&msg={msg}`

**uin是好友临时号码，不是QQ号**

### 发送好友消息

url: `/send_msg2group?uin={uin}&msg={msg}`

**uin是群临时号码，不是QQ号**

