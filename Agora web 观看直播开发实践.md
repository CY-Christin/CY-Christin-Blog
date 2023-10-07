# Agora web 观看直播开发实践

## 0. 背景

目前我司 App 端直播监控从之前的七牛云方案迁移至声网方案，那么对应的观看直播方式也要做改版。之前的观看直播方案很简单，拿到七牛云的直播流在 web 端放一个播放器即可实现。但是迁移至声网之后就要按照声网的方案来了，声网是以频道的形式实现直播，就是主播和观众都加入同一个频道，主播设置角色后推流（包括视频流和音频流），观众设置角色后只能接受流。web 端直播监控就是使用观众角色加入频道后进行观看的。  

## 1. 环境搭建

此处不多赘述，我们是 react 构建的页面，根据实际需求安装对应的声网 sdk 即可。

### 2. 流程

由于[声网文档](https://docportal.shengwang.cn/cn/live-streaming-standard-4.x/landing-page?platform=Web)中没有一个很好的实现流程，API 倒是很全，如果没有技术对接的话个人开发很麻烦，要去翻他们的文档看他们的示例代码，自己摸索很耗费时间。痛定思痛，决定写一份文档方便其他人参考。流程大致如下：

- 根据观众 id 和频道 id 生成 token。
- 加入频道
- 监听频道内发流事件，获取发流用户（即主播），订阅主播的音频流和视频流
- 将视频流放到 view 上播放，直接播放音频流  

其中还有很多可以个性化定制的地方，例如设置 log 等级，设置是否上报日志等功能，因为不是必须流程，我会在后面做补充，可以根据自己的需求来配置。

### 3. 开始开发

- 根据观众 id 和频道 id 生成 token。

​		生成 token 需要后端生成，前端传递对应参数即可。

​		注意： 观众 id 和频道 id 必须为字符串，否则无法生成。



- 加入频道

```
import AgoraRTC from 'agora';
const client = AgoraRTC.createClient({mode: 'live', codec: 'vp8'}); // 设置订阅频道格式，极速直播固定为vp8
/*
* appId 是应用对应的声网 id（必须为字符串），channel 是频道 id（必须为字符串），token 是后端生成的 token，audienceId  * 是观众 id（必须为数字）。
* 所有的参数和类型必须一一对应，否则后续即使成功加入频道也无法获取频道内信息
*/
await client.join(appId, String(channel), token, Number(audienceId));// 加入频道 
client.setClientRole('audience', {level: 1}); // 设置使用观众身份进入频道，level为1表示无延迟
```



- 监听频道内发流事件，获取发流用户（即主播），订阅主播的音频流和视频流

```
client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
  // 注意，如果房间内有多个主播，会显示为多个 user，可以用 client.remoteUsers 方法来获取房间内所有在发流的主播。
	await client.subscribe(user, mediaType); // 订阅频道内所有用户。
	user.audioTrack?.setVolume(0); // 将用户的音频流设置为静音
	setStreamer(user); // 将获取到的频道内 user 保存起来，方便后续播放时调用
}
```



- 将视频流放到 view 上播放，直接播放音频流  

```react
// 播放视频
  const container = useRef<HTMLDivElement>(null); // 获取需要播放视频的 view
	streamet.videoTrack.play(container.current); // 调用声网方法将视频流播放到 view 上
// 播放音频
	streamet.audioTrack?.setVolume(100); // 恢复音频流的音量
	streamet.audioTrack?.play(); // 播放音频流
```



至此，就可以实现一个 web 端观看直播的最小流程啦。



---

如果你还有其他需要个性化定制的需求，可以往下看。我列出了一些我司在播放视频之外的特殊需求，如果你也有相似的需求的话可以参考一下。

- pk 直播时将主播固定在左侧

此需求解决方案比较简单，不过需要其他业务流程来协助。

我们在获取到主播是 pk 时进行操作（可以从业务中获取，也可以在监听到频道内有两人发送视频流时直接开始）。

​	a. 首先将展示视频的 view 修改为能容下两人 pk 的大小，修改对应 view 的 css 即可

​	b. 然后将此房间内主播和来 pk 的主播单独存储

​	c. 然后在 view 左侧渲染主播视频流，在右侧渲染来 pk 的主播的视频刘

- 实时显示直播间内有几人发流（因为有多人直播的情况）

此需求需要用到声网的另一个 API ： `user-unpublished`，在 `user-published` 内使用一个变量存储房间内有多少人，在 ``user-unpublished``  内监听有多少主播停止发送流，将变量 - 1 即可。

- 全屏播放

此需求较为麻烦，因为声网没有现成的 API 来实现，需要手动实现一个全屏。而且一个页面上只能在一个 view 中播放一个视频流，也不能采用再创建一个 view 并播放的方案。可以将原 view 放大，也可以将原 view 销毁并在新 view 上播放视频流。

我的实现方法是在 view 右下角放置一个图标，点击时将原 view 放大（设置对应的 css，把 height 修改为页面高度，weight 根据宽高比修改为对应的宽度），再次点击时修改为原来大小。还需注意，声网播放视频的 view 需要和推流大小一致，否则在 web 端只会做裁切，不会自适应。



