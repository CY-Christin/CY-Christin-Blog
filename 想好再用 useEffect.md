# 想好再用 useEffect  
--- 
useEffect 是 react 内置的一个 hooks。有些组件需要与外部系统同步。例如，你可能希望根据 React state 控制非 React 组件、设置服务器连接或在组件出现在屏幕上时发送分析日志。Effects 会在渲染后运行一些代码，以便可以将组件与 React 之外的某些系统同步。  
**Effect 允许你指定由渲染本身，而不是特定事件引起的副作用。**  
如果没有涉及到外部系统（例如，你想根据 props 或 state 的变化来更新一个组件的 state），你就不应该使用 Effect。移除不必要的 Effect 可以让你的代码更容易理解，运行得更快，并且更少出错。  
## 常见的错误使用场景  
1. 用户事件  
例如你有可能想在用户点击按钮请求接口时使用 useEffect 来更新请求的 params 并发送请求。但这是不应该的，因为你完全可以使用一个事件来触发请求，而且使用 useEffect 还会使你分不清用户到底做了什么触发了这个请求。  
2. 使用 useEffect 来更新 state  
我最开始接触 hooks 时也犯过这样的错误，想要使用 useEffect 来更新 state。通过监听 state 的变化来更新其他 state。  
但是这样就有可能导致无限循环，因为每次更新 state 都会触发 useEffect，而 useEffect 又会更新 state。页面上会直接报错或者卡死。  
3. 依赖 props 来更新 state
这种情况下，你应该使用 useMemo 或者 useCallback 来更新 state。react 内置了许多 hooks，没必要盯着 useEffect 来用，多看看官网，说不定可以找到更符合你使用场景的 hooks。  
4. 初始化应用  
有些方法需要在初始化应用时调用一次，例如判断当前是在浏览器中还是 electron 中，这种情况只需要在初始化时调用一次即可，不需要每次渲染都调用。  
如果我们使用 useEffect，即使依赖数组写为空，依然会在渲染时调用一次。  
最好的方法就是写在 App 组件外面，这样只会在整个应用初始化时调用一次，后续再也用不到了。
5. 给 useEffect 添加多个依赖  
useEffect 在依赖改变时会运行一次，如果添加了过多的依赖会导致 useEffect 运行的次数过多，影响性能。严重的情况下还会导致 useEffect 无限循环。
6. 注意清理
useEffect 内部可以写 return 函数来清理副作用。例如在组件卸载时清除定时器。  
在卸载页面时要回头看一看这个页面有哪些需要被清理的东西，及时在 return 中做清理，否则会影响性能。
但是如果你在 return 函数中写了一个异步函数，这个异步函数会在组件卸载时运行，但是这个异步函数并不会阻塞组件的卸载。  
  

参考链接：
[你可能不需要 Effect – React 中文文档](https://zh-hans.react.dev/learn/you-might-not-need-an-effect)

