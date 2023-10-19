# async await 原理  
--- 

async...await 是ES8提出的基于Promise的解决异步的最终方案。它使用async关键字声明一个异步函数，而await关键字将某个函数调用包装成promise对象，从而可以等待函数执行完毕。

async...await 的工作原理是把一个异步函数变成一个Promise，它会把函数的返回值作为Promise的resolve结果或者reject的原因。除此之外，async/await还提供了await键字，用于等待异步任务的执行完成，以便获取异步任务的结果。

## JavaScript 异步编程

由于 JavaScript 是单线程执行模型，因此必须支持异步编程才能提高运行效率。异步编程的语法目标是让异步过程写起来像同步过程。

1. 回调函数

回调函数，就是把任务的第二段单独写在一个函数里面，等到重新执行这个任务的时候，就直接调用这个函数。

```js
const fs = require('fs')
fs.readFile('/etc/passwd', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  console.log(data.toString())
})
```

回调函数最大的问题是容易形成回调地狱，即多个回调函数嵌套，降低代码可读性，增加逻辑的复杂性，容易出错。

```js
fs.readFile(fileA, function (err, data) {
  fs.readFile(fileB, function (err, data) {
    // ...
  })
}
```

2. Promise

	为解决回调函数的不足，社区创造出 Promise。

```js
const fs = require('fs')

const readFileWithPromise = file => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

readFileWithPromise('/etc/passwd')
  .then(data => {
    console.log(data.toString())
    return readFileWithPromise('/etc/profile')
  })
  .then(data => {
    console.log(data.toString())
  })
  .catch(err => {
    console.log(err)
  })
```

Promise 实际上是利用编程技巧将回调函数改成链式调用，避免回调地狱。最大问题是代码冗余，原来的任务被 Promise 包装了一下，不管什么操作，一眼看去都是一堆 then，原来的语义变得很不清楚。

3. async, await

为了解决 Promise 的问题，async、await 在 ES7 中被提了出来，是目前为止最好的解决方案。

```js
const fs = require('fs')
async function readFile() {
  try {    
    var f1 = await readFileWithPromise('/etc/passwd')
    console.log(f1.toString())
    var f2 = await readFileWithPromise('/etc/profile')
    console.log(f2.toString())
  } catch (err) {
    console.log(err)
  }
}
```

async、await 函数写起来跟同步函数一样，条件是需要接收 Promise 或原始类型的值。

## 原理

async/await 函数使用时，函数在执行到 await 时会暂停函数，直到 await 等待的 Promise 状态改变，才会继续执行函数。这种工作方式和生成器工作方式很相似，而 async/await 的实现原理也是利用生成器实现的。

1. generator 函数

生成器函数是一个封装的异步任务，异步任务在需要暂停的地方会用 yield 标注。

```js
function* gen(x) {
  console.log('start')
  const y = yield x * 2
  return y
}

const g = gen(1)
g.next()   // start { value: 2, done: false }
g.next(4)  // { value: 4, done: true }
```

- gen() 不会立即执行，而是一上来就暂停，返回一个 Iterator 对象（具体可以参考 [Iterator遍历器](https://github.com/wangfupeng1988/js-async-tutorial/blob/master/part4-generator/02-iterator.md)）
- 每次 g.next() 都会打破暂停状态去执行，直到遇到下一个 yield 或者 return
- 遇到 yield 时，会执行 yeild 后面的表达式，并返回执行之后的值，然后再次进入暂停状态，此时 done: false。
- next 函数可以接受参数，作为上个阶段异步任务的返回结果，被函数体内的变量接收
- 遇到 return 时，会返回值，执行结束，即 done: true
- 每次 g.next() 的返回值永远都是 {value: ... , done: ...} 的形式

2. thunk 函数

JavaScript 中的 thunk 函数（译为转换程序）简单来说就是把带有回调函数的多参数函数转换成只接收回调函数的单参数版本。

```js
const fs = require('fs')
const thunkify = fn => (...rest) => callback => fn(...rest, callback)
const thunk = thunkify(fs.readFile)
const readFileThunk = thunk('/etc/passwd', 'utf8')
readFileThunk((err, data) => {
   // ...
})
```

单纯的 thunk 函数并没有很大的用处， 大牛们想到了和 generator 结合：

```js
/*
使用Generator函数和Thunks来实现异步文件读取。Generator函数readFileThunkWithGen定义了两个异步操作，使用yield语句将它们串联起来。
*/

function* readFileThunkWithGen() {
  try {
    const content1 = yield readFileThunk('/etc/passwd', 'utf8')
    console.log(content1)
    const content2 = yield readFileThunk('/etc/profile', 'utf8')
    console.log(content2)
    return 'done'
  } catch (err) {
    console.error(err)
    return 'fail'
  }  
}
/*
g.next().value启动Generator函数的执行，并返回第一个Thunk函数。当这个Thunk函数完成时，会调用g.next()，将控制权还给Generator函数，然后执行下一个Thunk函数。如果某个Thunk函数返回错误，将通过g.throw(err)将错误抛回Generator函数，并终止整个操作。
*/
const g = readFileThunkWithGen()
g.next().value((err, data) => {
  if (err) {
    return g.throw(err).value
  }
  g.next(data.toString()).value((err, data) => {
    if (err) {
      return g.throw(err).value
    }
    g.next(data.toString())
  })
})
```

thunk 函数的真正作用是统一多参数函数的调用方式，在 next 调用时把控制权交还给 generator，使 generator 函数可以使用递归方式自启动流程。

```js
const run = generator => {
  const g = generator()
  const next = (err, ...rest) => {
    if (err) {
      return g.throw(err).value
    }
    const result = g.next(rest.length > 1 ? rest : rest[0])
    if (result.done) {
      return result.value
    }
    result.value(next)
  }
  next()
}
run(readFileThunkWithGen)
```

有了自启动的加持之后，generator 函数内就可以写"同步"的代码了。generator 函数也可以与 Promise 结合：

```js
// 定义一个生成器函数，定义其中的两个异步操作，用 yield 串联
function* readFileWithGen() {
  try {    
    const content1 = yield readFileWithPromise('/etc/passwd', 'utf8')
    console.log(content1)
    const content2 = yield readFileWithPromise('/etc/profile', 'utf8')
    console.log(content2)
    return 'done'
  } catch (err) {
    console.error(err)
    return 'fail'
  }
}
// 定义 run 函数，接受一个生成器，返回一个 promise
const run = generator => {
  return new Promise((resolve, reject) => {
    const g = generator() // 调用生成器得到一个 generator 对象 g
    const next = res => { // 定义 next 函数用于处理生成器函数中的每一个异步操作
      const result = g.next(res) // next函数调用Generator对象的next方法，获取当前异步操作的结果对象result
      if (result.done) {
        return resolve(result.value)
      }
      result.value
        .then(
          next,
          err => reject(gen.throw(err).value)
        )
    }
    next()
  })
}

run(readFileWithGen)
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

generator 可以暂停执行，很容易让它和异步操作产生联系，因为我们在处理异步操作时，在等待的时候可以暂停当前任务，把程序控制权交还给其他程序，当异步任务有返回时，在回调中再把控制权交还给之前的任务。generator 实际上并没有改变 JavaScript 单线程、使用回调处理异步任务的本质。

**3. co 函数库**

每次执行 generator 函数时自己写启动器比较麻烦。[co函数库](https://github.com/tj/co) 是一个 generator 函数的自启动执行器，使用条件是 generator 函数的 yield 命令后面，只能是 thunk 函数或 Promise 对象，co 函数执行完返回一个 Promise 对象。

```js
const co = require('co')
co(readFileWithGen).then(res => console.log(res)) // 'done'
co(readFileThunkWithGen).then(res => console.log(res)) // 'done'
```

co 函数库的源码实现其实就是把上面两种情况做了综合:

```js
// 做了简化，与源码基本一致
/*
co函数接受一个Generator函数和一些参数，返回一个Promise对象。在co函数内部，首先调用Generator函数，得到一个Generator对象gen。然后定义两个回调函数onFulfilled和onRejected，用于处理异步操作成功和失败的情况。
*/
const co = (generator, ...rest) => {
  const ctx = this
  return new Promise((resolve, reject) => {
    const gen = generator.call(ctx, ...rest)
    if (!gen || typeof gen.next !== 'function') {
      return resolve(gen)
    } 
    /*
    在onFulfilled函数中，首先调用gen.next方法，获取当前异步操作的结果对象ret。如果获取失败，将会抛出错误。否则，调用next函数，将控制权还给co函数，继续执行下一个异步操作。
    */
    const onFulfilled = res => {
      let ret
      try {
        ret = gen.next(res)
      } catch (e) {
        return reject(e)
      }
      next(ret)
    }    
		/*
		在onRejected函数中，与onFulfilled函数类似，但是调用的是gen.throw方法，用于抛出错误。最后，定义next函数，用于处理异步操作的结果。如果异步操作执行成功，调用resolve函数，将结果返回。否则，将异步操作转换成Promise对象，并通过toPromise函数来处理。
		*/
    const onRejected = err => {
      let ret
      try {
        ret = gen.throw(err)
      } catch (e) {
        return reject(e)
      }
      next(ret)
    }

    const next = result => {
      if (result.done) {
        return resolve(result.value)
      }
      toPromise(result.value).then(onFulfilled, onRejected)
    }

    onFulfilled()
  })  
}
/*
toPromise函数用于将异步操作转换成Promise对象。如果传入的参数本身就是Promise对象，直接返回。否则，判断参数类型是否为函数，如果是，将函数转换成Promise对象，并将函数执行结果作为Promise的resolve值。如果函数执行出错，将Promise对象的状态设置为rejected，并将错误信息作为Promise的reject值。
*/
const toPromise = value => {
  if (isPromise(value)) return value
  if ('function' == typeof value) {
    return new Promise((resolve, reject) => {
      value((err, ...rest) => {
        if (err) {
          return reject(err)
        }
        resolve(rest.length > 1 ? rest : rest[0])
      })
    })
  }
}
```

4. 理解 async, await 函数

   一句话，async、await 是 co 库的官方实现。也可以看作自带启动器的 generator 函数的语法糖。不同的是，async、await 只支持 Promise 和原始类型的值，不支持 thunk 函数。

```js
// generator with co
co(function* () {
  try {    
    const content1 = yield readFileWithPromise('/etc/passwd', 'utf8')
    console.log(content1)
    const content2 = yield readFileWithPromise('/etc/profile', 'utf8')
    console.log(content2)
    return 'done'
  } catch (err) {
    console.error(err)
    return 'fail'
  }
})

// async await
async function readfile() {
  try {
    const content1 = await readFileWithPromise('/etc/passwd', 'utf8')
    console.log(content1)
    const content2 = await readFileWithPromise('/etc/profile', 'utf8')
    console.log(content2)
    return 'done'
  } catch (err) {
    throw(err)
  }
}
readfile().then(
  res => console.log(res),
  err => console.error(err)
)
```

async,await函数具有传播性，调用 async 的时候需要使用 await。
