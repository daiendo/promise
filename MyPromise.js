
/**
 * 自定义Promise
 * ES5语法实现    
 * 实现方法：自执行函数【IIFE】
 * daiend
 */

 (function (window) {

    //状态常量
    const PENDING = 'pending';
    const RESOLVED = 'resolved';
    const REJECTED = 'rejected';
     /**
      * MyPromise构造函数
      * @param function（同步）
      * @return 成功 or 失败
      */
     function MyPromise(excutor){//接收一个执行器函数为参数
        const that = this;
        that.status = PENDING;  //给Promise对象指定status属性，初始值为pending
        that.data = undefined;  //给Promise对象指定一个用于储存结果数据的属性
        that.callbacks = []; //储存回调函数，每个元素的结构：{onrResolved(){},onRejected(){}}

        //立即同步执行excutor
        try {     //若执行器抛出异常，直接变为rejected状态
            excutor(resolve,reject)
        } catch (error) {
            reject(error)
        }

        function resolve(value){
            //判断当前状态
            if(that.status !== PENDING)return
            //将状态改变为resolved
            that.status = RESOLVED
            //保存value数据
            that.data = value;
            //如果有待执行的callback函数，立即【异步】执行回调函数onResolved
            if(that.callbacks.length > 0){
                setTimeout(()=>{   //放入异步队列
                    that.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                })
            }
        }
        function reject(reason){
            //判断当前状态
            if(that.status !== PENDING)return
            //将状态改变为rejected
            that.status = REJECTED
            //保存reason数据
            that.data = reason;
            //如果有待执行的callback函数，立即【异步】执行回调函数onRejected
            if(that.callbacks.length > 0){
                setTimeout(()=>{   //放入异步队列
                    that.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                })
            }
        }
     }
     /**
      * 原型方法
      * @param function,function
      * @return 新的MyPromise
      */
     MyPromise.prototype.then = function(onResolved,onRejected){//then方法:接收成功和失败的回调

        onResolved = typeof onResolved === 'function' ? onResolved : value => {value}  //若不是函数,就将回调函数的参数向后传递成功的value
        //无第二个参数，指定默认的失败回调（错误/异常传透）
        onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason} //若不是函数,就将回调函数的参数作为失败的reason

        const that = this
        
        return new MyPromise((resolve,reject)=>{
            /**
             * 此函数用来判断then方法的callback执行结果来返回的新的Promise的状态
             */
            function handle(callback){
                /**
                 * 1.如果执行异常，return失败的Promise，reasonerror为reason
                 * 2.如果then的callback回调函数的返回值不是Promise，return成功的Promise，回调函数的返回值为value
                 * 3.如果then的callback回调函数的返回值是Promise，return的就是callback返回的Promise【回到then方法判断】
                 */
                try {
                    const result = callback(that.data)
                    if(result instanceof MyPromise){
                        // result.then(//类似递归，又回到了then方法
                        //     value => resolve(value), //当result成功时，return的Promise也成功
                        //     reason =>reject(reason)  //当result失败时，return的Promise也失败
                        //     )
                            /**
                             * 以上的三行代码的简洁写法
                             */
                        result.then(resolve,reject)
                    }else{
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            }

            if(that.status === PENDING){
                that.callbacks.push({//pending状态
                    onResolved(value){
                        handle(onResolved)
                    },
                    onRejected(reason){
                        handle(onRejected)
                    }
                })
            }else if(that.status === RESOLVED){
                setTimeout(()=>{
                    handle(onResolved)
                })
            }else{
                setTimeout(()=>{
                    handle(onRejected)
                })
            }
        })
     }
     /**
      * 原型方法
      * @param function,function
      * @return 新的MyPromise
      */
     MyPromise.prototype.catch = function(onRejected){//
        return this.then(undefined,onRejected)
     }
     /**
      * MyPromise 对象方法
      * @param 执行结果
      * @return 指定执行结果的MyPromise
      */
     MyPromise.resolve = function(value){
        return new MyPromise((resolve,reject)=>{
            if(value instanceof MyPromise){//如果参数为Promise对象，获取此Promise对象的执行结果，决定最后的结果
                value.then(resolve,reject)
            }else{//如果参数不是Promise对象，直接执行成功
                resolve(value)
            }
        })
     }
     /**
      * MyPromise 对象方法
      * @param  失败的原因
      * @return 指定失败原因的MyPromise
      */
     MyPromise.reject = function(reason){
        return new MyPromise((resolve,reject)=>{//直接执行失败
            reject(reason)
        })
     }
     /**
      * MyPromise 对象方法
      * @param  Promise数组
      * @return Promise 【只有Promise数组全部成功，返回成功的回调】
      */
     MyPromise.all = function(promisesArray){
         const values = new Array(promisesArray.length); //用来存储所有成功的Promise的value
         let resolvedCount = 0;  //用来计数成功的Promise的个数，最后用来判断完成的个数是否等于promisesArray。length
        return new MyPromise((resolve,reject)=>{
            //遍历获取每个Promise的结果
            promisesArray.forEach((pro,index)=>{
                MyPromise.resolve(pro).then(value=>{
                    resolvedCount++
                    values[index] = value   //保证同promisesArray的顺序保存value
                    if(resolvedCount === promisesArray.length){
                        resolve(values)
                    }
                },reason=>{//有一个失败，则直接执行失败
                    reject(reason)
                })
            })
        })
     }
     /**
      * MyPromise 对象方法
      * @param  Promise数组,,【数组元素不一定都是Promise对象】
      * @return Promise 【结果由Promise数组第一个完成的Promise决定】
      */
     MyPromise.race = function(promisesArray){
        return new MyPromise((resolve,reject)=>{
            promisesArray.forEach((pro,index)=>{
                MyPromise.resolve(pro).then(value=>{//包装成Promise对象再点then
                    resolve(value)
                },reason=>{
                    reject(reason)
                })
            })
        })
     }

     /**
      * MyPromise 对象方法
      * @param  执行结果，延迟时间
      * @return 指定时间后返回执行结果
      */
     MyPromise.resolveDelay = function(value,time){
        return new MyPromise((resolve,reject)=>{
            setTimeout(()=>{
                if(value instanceof MyPromise){//如果参数为Promise对象，获取此Promise对象的执行结果，决定最后的结果
                    value.then(resolve,reject)
                }else{//如果参数不是Promise对象，直接执行成功
                    resolve(value)
                }
            },time)
        })   
     }
     /**
      * MyPromise 对象方法
      * @param  执行失败结果，延迟时间
      * @return 指定时间后返回失败结果
      */
     MyPromise.rejectDelay = function(reason,time){
        return new MyPromise((resolve,reject)=>{//直接执行失败
            setTimeout(()=>{
                reject(reason)
            },time)
        })
    }
     window.MyPromise = MyPromise;
 })(window)