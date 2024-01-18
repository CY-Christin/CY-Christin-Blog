# 使用 node 中间件统一处理站内信  
---
我司站内信有一部分是前端通过 node 发送的，主要场景是审核和举报时需要站内信通过用户结果。  
之前是分散在代码中的，比如在一个接口内处理完审核逻辑后，再调用一个发送站内信的接口。但是这样就导致了如果要修改站内信格式需要修改多个地方，每次修改站内信都是折磨，要分别找到接口，在接口内修改内容。  
在最近的一个需求中正好要优化站内信，我就顺势提出使用中间件统一处理站内信的优化方案。新方案相较于老方案至少是更集中了，不管是以后需要优化还是修改站内信内容都更方便了一点。  
## 1. 使用中间件  
我司使用的 node 框架是 koa2，在 app.js 中引入中间件方法后使用 use 方法使用中间件。  
```javascript
import sendMsg from './middlewares/sendMsg';
const app = new Koa();  
app.use(sendMsg);
```  
在 middlewares 文件中 index.js 中使用遍历方法，直接遍历文件夹中所有的文件并注册为中间件：  
```javascript
import requireIndex from 'es6-requireindex';

const middleswares = {};
const dir = requireIndex(__dirname);
Object.keys(dir).forEach((item) => {
  middleswares[item] = dir[item];
});

export default middleswares;
```
在中间件文件中写方法来处理站内信内容，这里我还加了一个方法，将`/api/xxx`的接口转换为`api_xxx`，并将这种结果定义为方法名，
可以很方便地找到接口对应的站内信方法。
```javascript
function convertToCamelCase(input) {
	// /api/v1/xxx/xxx => api_v1_xxx_xxx
	const parts = input.split("/").filter(part => part !== ""); // 分割字符串并过滤空字符串
	 // 使用下划线连接分割后的字符串
	return parts.join("_");
}
```
## 2. 处理数据，发送站内信
因为我们之前的中间件都是处理接口逻辑之前的内容，所以刚开始我还以为只能做成先发送站内信再做逻辑处理。
但是这样就可能会碰到接口逻辑报错，但是用户还是收到了站内信。  
经过查找后发现可以在中间件的方法中使用`next()`方法来表示接口内逻辑。
```javascript
export default () => async (ctx, next) => {
	// 接口逻辑前的内容
	await next();
  // 接口逻辑后的内容
};
```  
知道这个之后就可以在 `await next()`方法之后再调用站内信逻辑，这样整个流程就比较正常了。  
因为有些接口需要站内信，有些接口是不需要的，所以还需要对接口做过滤，判断是否能进入站内信的中间件。  
这部分我是在进入中间件后做判断， 如果有 `ctx.body` 而且 `ctx.body.code` 为 0，就表示接口逻辑正常；还加了一个方法判断，判断这个接口有没有对应的站内信
方法可以处理。
```javascript
if (ctx.body && (ctx.body.code === 1 || ctx.body.status === 1 || ctx.body.code === 0)
	&& func[convertToCamelCase(url)]) {
	console.log('------------sendMsg-----------')
	await func[convertToCamelCase(url)](ctx.request.body, ctx.body);
	console.log('send msg success');
}
```  
这里我把接口接受和返回的参数都传入方法了，因为有的接口只需要根据页面传入的数据就可以组合站内信发送，
而有的接口则需要经过接口逻辑查询数据后再组合成站内信。  
之前我考虑的很简单，前端只需传 id，在站内信内部再查表或者调用接口查询对应的数据即可。但是这样忽略了一个问题，有的场景下是要判断数据是否删除，如果数据没有删除，在程序中
处理删除数据并发送站内信。如果按照先删除数据再从中间件判断发送站内信，
那这个时候的中间件内查到的数据都是已删除的。在业务逻辑上会碰到一些问题，而且我们的一些数据还是硬删除的，在中间件内是查不到数据的，那这时候发送站内信就无法携带原始数据内容。  
所以我就把接口返回的数据也传到了中间件内，在接口内查好数据，使用统一的字段传入中间件，用作中间件内组合站内信内容。  
### 3. 站内信内容  
以其中的一个方法为例：
```javascript
async appuser_deleteMoment(request) {
	const { list, sendBool } = request;
	if (!sendBool) {
		return;
	}
	list.map(async (item) => {
    await services.common.sendMsg('3568', item.userId, getSendTextA(item.time, item.type, item.text));
	})
}
```
在这个方法内，我只用到了传入接口的数据，根据是否发送站内信字段判断是否能发，然后再遍历数据，根据数据组合站内信内容。  
```javascript
export function getDeletedContentText(text, timeValue) {
  return `亲爱的用户你好……，时间是${time}，内容是${text}，……`;
}
```
再将站内信封装成方法，方便其他地方调用。  
这里写的比较简单，实际上我们的业务内还要根据不同的 type 发送不同的内容，还要根据用户的日志是否隐藏判断内容中是否需要携带相应字段，还要根据用户的设置判断是否需要发送站内信。
最后这一步还是比较麻烦的。  
同时，在各个方法内打好日志，方便有客服上报 bug 时可以及时查找到问题。
