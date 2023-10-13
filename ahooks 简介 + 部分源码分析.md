# ahooks 简介 + 源码分析
--- 
ahooks 官网：https://ahooks.js.org/zh-CN/  

## 特性
- 易学易用
- 支持 SSR
- 对输入输出函数做了特殊处理，且避免闭包问题
- 包含大量提炼自业务的高级 Hooks
- 包含丰富的基础 Hooks
- 使用 TypeScript 构建，提供完整的类型定义文件

### useRequest

`useRequest` 通过插件式组织代码，核心代码极其简单，并且可以很方便地扩展出更高级的功能。目前已有能力包括：

- 自动请求/手动请求
- 轮询
- 防抖
- 节流
- 屏幕聚焦重新请求
- 错误重试
- loading delay
- SWR(stale-while-revalidate)
- 缓存

#### 默认用法

`useRequest` 的第一个参数是一个异步函数，在组件初次加载时，会自动触发该函数执行。同时自动管理该异步函数的 `loading` , `data` , `error` 等状态。

```javascript
const { data, error, loading } = useRequest(getUsername);
```

#### 手动触发

如果设置了 `options.manual = true`，则 `useRequest` 不会默认执行，需要通过 `run` 或者 `runAsync` 来触发执行。

```tsx
const { loading, run } = useRequest(changeUsername, {
  manual: true
});

<button onClick={run} disabled={loading}>
  {loading ? 'Loading' : 'Edit'}
</button>
```

完整代码：

```tsx
import { message } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'ahooks';

function editUsername(username: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve();
      } else {
        reject(new Error('Failed to modify username'));
      }
    }, 1000);
  });
}

export default () => {
  const [state, setState] = useState('');

  // run
  const { loading, run } = useRequest(editUsername, {
    manual: true,
    onSuccess: (result, params) => {
      setState('');
      message.success(`The username was changed to "${params[0]}" !`);
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  /* runAsync
  const { loading, runAsync } = useRequest(editUsername, {
      manual: true,
    });

    const onClick = async () => {
      try {
        await runAsync(state);
        setState('');
        message.success(`The username was changed to "${state}" !`);
      } catch (error) {
        message.error(error.message);
      }
    };
  */
  return (
    <div>
      <input
        onChange={(e) => setState(e.target.value)}
        value={state}
        placeholder="Please enter username"
        style={{ width: 240, marginRight: 16 }}
      />
      <button disabled={loading} type="button" onClick={() => run(state)}>
        {loading ? 'Loading' : 'Edit'}
      </button>
    </div>
  );
};
```

`run` 与 `runAsync` 的区别在于：

- `run` 是一个普通的同步函数，我们会自动捕获异常，你可以通过 `options.onError` 来处理异常时的行为。
- `runAsync` 是一个返回 `Promise` 的异步函数，如果使用 `runAsync` 来调用，则意味着你需要自己捕获异常。

#### 生命周期

`useRequest` 提供了以下几个生命周期配置项，供你在异步函数的不同阶段做一些处理。

- `onBefore`：请求之前触发
- `onSuccess`：请求成功触发
- `onError`：请求失败触发
- `onFinally`：请求完成触发

```ts
  const { loading, run } = useRequest(editUsername, {
    manual: true,
    onBefore: (params) => {
      message.info(`Start Request: ${params[0]}`);
    },
    onSuccess: (result, params) => {
      setState('');
      message.success(`The username was changed to "${params[0]}" !`);
    },
    onError: (error) => {
      message.error(error.message);
    },
    onFinally: (params, result, error) => {
      message.info(`Request finish`);
    },
  });
```

#### 参数管理

`useRequest` 返回的 `params` 会记录当次调用 `service` 的参数数组。比如你触发了 `run(1, 2, 3)`，则 `params` 等于 `[1, 2, 3]` 。

如果我们设置了 `options.manual = false`，则首次调用 `service` 的参数可以通过 `options.defaultParams` 来设置。

#### Loading Delay

通过设置 `options.loadingDelay` ，可以延迟 `loading` 变成 `true` 的时间，有效防止闪烁。

```tsx
const { loading, data } = useRequest(getUsername, {
  loadingDelay: 300
});


return <div>{ loading ? 'Loading...' : data }</div>
```

例如上面的场景，假如 `getUsername` 在 300ms 内返回，则 `loading` 不会变成 `true`，避免了页面展示 `Loading...` 的情况。

#### 轮询

通过设置 `options.pollingInterval`，进入轮询模式，`useRequest` 会定时触发 service 执行。

```tsx
const { data, run, cancel } = useRequest(getUsername, {
  pollingInterval: 3000,
});
```

例如上面的场景，会每隔 3000ms 请求一次 `getUsername`。同时你可以通过 `cancel` 来停止轮询，通过 `run/runAsync` 来启动轮询。



### useAntdTable



```tsx
import React from 'react';
import { Button, Col, Form, Input, Row, Table, Select } from 'antd';
import { useAntdTable } from 'ahooks';

const { Option } = Select;

interface Item {
  name: {
    last: string;
  };
  email: string;
  phone: string;
  gender: 'male' | 'female';
}

interface Result {
  total: number;
  list: Item[];
}
// 请求数据
const getTableData = ({ current, pageSize }, formData: Object): Promise<Result> => {
  let query = `page=${current}&size=${pageSize}`;
  Object.entries(formData).forEach(([key, value]) => {
    if (value) {
      query += `&${key}=${value}`;
    }
  });

  return fetch(`https://randomuser.me/api?results=55&${query}`)
    .then((res) => res.json())
    .then((res) => ({
      total: res.info.results,
      list: res.results,
    }));
};

export default () => {
  const [form] = Form.useForm();

  const { tableProps, search, params } = useAntdTable(getTableData, {
    defaultPageSize: 5,
    form,
  });

  const { type, changeType, submit, reset } = search;

  const columns = [
    {
      title: 'name',
      dataIndex: ['name', 'last'],
    },
    {
      title: 'email',
      dataIndex: 'email',
    },
    {
      title: 'phone',
      dataIndex: 'phone',
    },
    {
      title: 'gender',
      dataIndex: 'gender',
    },
  ];

  const advanceSearchForm = (
    <div>
      <Form form={form}>
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="name" name="name">
              <Input placeholder="name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="email" name="email">
              <Input placeholder="email" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="phone" name="phone">
              <Input placeholder="phone" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24} justify="end" style={{ marginBottom: 24 }}>
          <Button type="primary" onClick={submit}>
            Search
          </Button>
          <Button onClick={reset} style={{ marginLeft: 16 }}>
            Reset
          </Button>
          <Button type="link" onClick={changeType}>
            Simple Search
          </Button>
        </Row>
      </Form>
    </div>
  );

  return (
    <div>
      {advanceSearchForm}
      <Table columns={columns} rowKey="email" {...tableProps} />

      <div style={{ background: '#f5f5f5', padding: 8 }}>
        <p>Current Table: {JSON.stringify(params[0])}</p>
        <p>Current Form: {JSON.stringify(params[1])}</p>
      </div>
    </div>
  );
};
```



### useWebSocket

```tsx
import React, { useRef, useMemo } from 'react';
import { useWebSocket } from 'ahooks';

enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

export default () => {
  const messageHistory = useRef<any[]>([]);

  const { readyState, sendMessage, latestMessage, disconnect, connect } = useWebSocket(
    'wss://demo.piesocket.com/v3/channel_1?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self',
  );

  messageHistory.current = useMemo(
    () => messageHistory.current.concat(latestMessage),
    [latestMessage],
  );

  return (
    <div>
      {/* send message */}
      <button
        onClick={() => sendMessage && sendMessage(`${Date.now()}`)}
        disabled={readyState !== ReadyState.Open}
        style={{ marginRight: 8 }}
      >
        ✉️ send
      </button>
      {/* disconnect */}
      <button
        onClick={() => disconnect && disconnect()}
        disabled={readyState !== ReadyState.Open}
        style={{ marginRight: 8 }}
      >
        ❌ disconnect
      </button>
      {/* connect */}
      <button onClick={() => connect && connect()} disabled={readyState === ReadyState.Open}>
        {readyState === ReadyState.Connecting ? 'connecting' : '📞 connect'}
      </button>
      <div style={{ marginTop: 8 }}>readyState: {readyState}</div>
      <div style={{ marginTop: 8 }}>
        <p>received message: </p>
        {messageHistory.current.map((message, index) => (
          <p key={index} style={{ wordWrap: 'break-word' }}>
            {message?.data}
          </p>
        ))}
      </div>
    </div>
  );
};
```

### useSafeState

用法与 `React.useState` 完全一样，但是在组件卸载后异步回调内的 `setState` 不再执行，避免因组件卸载后更新状态而导致的内存泄漏。



### 生命周期类

- useMount // 只在组件初始化时执行的函数
- useUnmount // 组件卸载时执行的函数
- useUnmountedRef // 获取组件卸载状态

### 持久化存储

分别有`useSessionStorageState`、`useLocalStorageState`、`useCookieState`，都是ahooks提供的状态持久化存储Hook。专门用于在组件中使用存储状态。

使用方法也很简单，就不在这里过多解释了，最重要的是`useSessionStorageState`和`useLocalStorageState`支持自动序列化，也就是说你可以直接存储对象，它会帮你自动序列化成字符串，而你在界面上调用时，它也会帮你自动转化为对象。

### DOM 类

- useDrop & useDrag
- useEventListener
- useFavicon
- useSize

……

### Dev 类

- useTrackedEffect // 追踪是哪个依赖变化触发了 `useEffect` 的执行。
- useWhyDidYouUpdate // 帮助开发者排查是那个属性改变导致了组件的 rerender。



### useRequest 源码分析

```ts
 // 其实useRequest整个初始化的代码就只有这点，因为这次官方将各个功能抽取成了插件的方式去实现
 function useRequest<TData, TParams extends any[]>(
   service: Service<TData, TParams>,
   options?: Options<TData, TParams>,
   plugins?: Plugin<TData, TParams>[],
 ) {
   return useRequestImplement<TData, TParams>(service, options, [
     ...(plugins || []), // 我们也可以传入自己的plugin
     useDebouncePlugin, // 防抖
     useLoadingDelayPlugin, // 延迟loading的状态
     usePollingPlugin, // 轮训
     useRefreshOnWindowFocusPlugin, // 窗口聚焦时重新请求
     useThrottlePlugin, // 节流
     useAutoRunPlugin, // 根据ready的变化自动请求
     useCachePlugin, // 缓存
     useRetryPlugin, // 错误重试
 ])}
```



**useRequestImplement**

```ts
 function useRequestImplement<TData, TParams extends any[]>(
   service: Service<TData, TParams>,
   options: Options<TData, TParams> = {},
   plugins: Plugin<TData, TParams>[] = [],
 ) {
   // 默认是自动发送请求的
   const { manual = false, ...rest } = options;
   const fetchOptions = {
     manual,
     ...rest,
   };
   // 保存最新的请求方法的引用
   const serviceRef = useLatest(service);
   // 更新
   const update = useUpdate();
   // 创建请求实例
   const fetchInstance = useCreation(() => {
     // 运行每个插件的onInit方法
     const initState = plugins.map((p) => p?.onInit?.(fetchOptions)).filter(Boolean);
     return new Fetch<TData, TParams>(
       serviceRef,
       fetchOptions,
       update,
       Object.assign({}, ...initState),
     );
   }, []);
   fetchInstance.options = fetchOptions;
   // 运行所有plugin
   fetchInstance.pluginImpls = plugins.map((p) => p(fetchInstance, fetchOptions));

   // 挂载的时候如果是自动的则发起请求
   useMount(() => {
     if (!manual) {
       // useCachePlugin can set fetchInstance.state.params from cache when init
       const params = fetchInstance.state.params || options.defaultParams || [];
       fetchInstance.run(...params);
     }
   });

   // 卸载的时候取消请求
   useUnmount(() => {
     fetchInstance.cancel();
   });

   // 返回数据
   return {
     loading: fetchInstance.state.loading,
     data: fetchInstance.state.data,
     error: fetchInstance.state.error,
     params: fetchInstance.state.params || [],
     cancel: useMemoizedFn(fetchInstance.cancel.bind(fetchInstance)),
     refresh: useMemoizedFn(fetchInstance.refresh.bind(fetchInstance)),
     refreshAsync: useMemoizedFn(fetchInstance.refreshAsync.bind(fetchInstance)),
     run: useMemoizedFn(fetchInstance.run.bind(fetchInstance)),
     runAsync: useMemoizedFn(fetchInstance.runAsync.bind(fetchInstance)),
     mutate: useMemoizedFn(fetchInstance.mutate.bind(fetchInstance)),
   };
 }
```



**Fetch**

```ts
 export default class Fetch<TData, TParams extends any[]> {
   // 所有的插件
   pluginImpls: PluginReturn<TData, TParams>[];
   // 计数器
   count: number = 0;
   // 初始数据
   state: FetchState<TData, TParams> = {
     loading: false,
     params: undefined,
     data: undefined,
     error: undefined,
   };

   constructor(
     public serviceRef: MutableRefObject<Service<TData, TParams>>,
     public options: Options<TData, TParams>,
     public subscribe: Subscribe,
     public initState: Partial<FetchState<TData, TParams>> = {},
   ) {
     this.state = {
       ...this.state,
       // 这里loading会根据是否是自动请求判断，后面也会被initState里面useAutoRunPlugin的onInit的返回状态决定
       loading: !options.manual,
       ...initState,
     };
   }
   // 这里的setState不是react class里面的setState，只是模拟了类似的实现
   setState(s: Partial<FetchState<TData, TParams>> = {}) {
     this.state = {
       ...this.state,
       ...s,
     };
     this.subscribe();
   }
   // 定义调用插件xx生命周期的公共方法
   runPluginHandler(event: keyof PluginReturn<TData, TParams>, ...rest: any[]) {
     // @ts-ignore
     const r = this.pluginImpls.map((i) => i[event]?.(...rest)).filter(Boolean);
     return Object.assign({}, ...r);
   }
   // 执行请求，也是我们使用时解构出来的run
   run(...params: TParams) {
     // 调用runAsync实现
     this.runAsync(...params)
       // 这也是为什么run会自动捕获异常的原因
       .catch((error) => {
       if (!this.options.onError) {
         console.error(error);
       }
     });
   }
   
   // 取消请求
   cancel() {
     this.count += 1;
     this.setState({
       loading: false,
     });
     // 调用插件的onCancel方法
     this.runPluginHandler('onCancel');
   }
  
   // 刷新其实就是重新请求
   refresh() {
     this.run(...(this.state.params || []));
   }
   
   // 同上
   refreshAsync() {
     return this.runAsync(...(this.state.params || []));
   }
   
   // 手动更改返回的数据
   mutate(data?: TData | ((oldData?: TData) => TData | undefined)) {
     let targetData: TData | undefined;
     if (typeof data === 'function') {
       targetData = data(this.state.data);
     } else {
       targetData = data;
     }
     // 调用插件的onMutate方法
     this.runPluginHandler('onMutate', targetData);
     this.setState({
       data: targetData,
     });
   }
   
   // 这个方法是真正处理所有逻辑的地方，所以单独拿出来看
   runAsync(){
       // ...
   }
   
 }
```



**runAsync**

```ts
async function runAsync(...params: TParams[]): Promise<TData> {
    // 计数器+1
    this.count += 1;
    const currentCount = this.count;

    const {
        stopNow = false, // !ready return true
        returnNow = false, // 如果缓存可以使用
        ...state // 如果有缓存这里的值会设置为缓存的值（不管有没有过期）
    } = this.runPluginHandler('onBefore', params);

    // stop request
    if (stopNow) {
        return new Promise(() => {
        });
    }

    this.setState({
        loading: true,
        params,
        ...state,
    });

    // 使用缓存
    if (returnNow) {
        return Promise.resolve(state.data);
    }
    // 调用自己传入的onBefore
    this.options.onBefore?.(params);

    try {
        // replace service
        // 后面会讲到与缓存有关
        let {servicePromise} = this.runPluginHandler('onRequest', this.serviceRef.current, params);

        if (!servicePromise) {
            // 调用者传入的service
            servicePromise = this.serviceRef.current(...params);
        }

        const res = await servicePromise;

        // 这里的count在没次run和cancel都会+1，如果在请求之前没有调用cancel，那么两次的count是相等的
        if (currentCount !== this.count) {
            // prevent run.then when request is canceled
            return new Promise(() => {
            });
        }

        // 返回请求回来的数据 
        this.setState({
            data: res,
            error: undefined,
            loading: false,
        });

        // 调用onSuccess生命周期
        this.options.onSuccess?.(res, params);
        this.runPluginHandler('onSuccess', res, params);

        // 调用onFinally生命周期
        this.options.onFinally?.(params, res, undefined);
        if (currentCount === this.count) {
            this.runPluginHandler('onFinally', params, res, undefined);
        }

        return res;
    } catch (error) {
        if (currentCount !== this.count) {
            // prevent run.then when request is canceled
            return new Promise(() => {
            });
        }

        this.setState({
            error,
            loading: false,
        });

        // 调用onError生命周期
        this.options.onError?.(error, params);
        this.runPluginHandler('onError', error, params);

        // 调用onFinally生命周期
        this.options.onFinally?.(params, undefined, error);
        if (currentCount === this.count) {
            this.runPluginHandler('onFinally', params, undefined, error);
        }

        throw error;
    }
}
```



**plugin**

……
