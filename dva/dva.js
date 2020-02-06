import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import { createHashHistory } from 'history';

const history = createHashHistory();
const sagaMiddleware = createSagaMiddleware();

// ---------- Reducers start ----------

function buildReducers(namespace, defaultState, reducers) {

  return (state = defaultState, action) => {
    // reducer 处理的函数数组
    const arrReducer = Object.keys(reducers).map(v => {
      const actionType = v;
      const fn = reducers[v];
      // action 是一个对象，其中的type属性是必须的，表示 Action 的名称
      return (state, action) => {
        const { type, payload } = action;
        if (`${namespace}/${actionType}` === type) {
          return fn(state, action)
        }
        return state;
      }
    });
  
    // 用函数处理state，生成新的state
    return arrReducer.reduce(function (total, currentValue) {
      return currentValue(total, action)
    }, state)
  }
}


// ---------- Reducers end ----------


// ---------- Subscriptions start ----------

const dispatchFn = (store, namespace) => (action) => store.dispatch({
  ...action,
  type: `${namespace}/${action.type}`
})

function buildSubscriptions(obj, store) {
  Object.keys(obj).forEach(v => {
    const namespace = v;
    const subscriptions = obj[v];
    Object.keys(subscriptions).forEach(val => {
      const fn = subscriptions[val];
      fn({
        dispatch: dispatchFn(store, namespace),
        history,
      })
    })
  })
}

// ---------- Subscriptions end ----------



// ---------- Effects start ----------

const buildEffects = (effects, namespace) => {
  return function* () {
    for (const key in effects) {
      // 保证是原始的hasOwnProperty条用
      if (Object.prototype.hasOwnProperty.call(effects, key)) {
        const fn = effects[key];
        const sage = (action) => {
          return fn(action, buildSaga(namespace))
        }
        yield sagaEffects.takeEvery(`${namespace}/${key}`, sage);
      }
    }
  }
}

const buildSaga = (namespace) => {
  const put = (action) => {
    const { type } = action;
    return sagaEffects.put({
      ...action,
      type: `${namespace}/${type}`
    })
  }

  return {
    ...sagaEffects,
    put,
  };
}

// ---------- Effects end ----------


function getProvider(store, router) {
  return (
    <Provider store={store}>
      {router}
    </Provider>
  )
}

export default function dva(opts = {}) {
  const app = {
    // properties
    _router: null,
    _reducers: {},
    _subscriptions: {},
    _effects: [],

    // methods
    start,
    router,
    model,
  }

  return app;


  function router(route) {
    app._router = route;
  }

  function model(params) {
    const {
      namespace = '',
      reducers = {},
      state = {},
      effects = {},
      subscriptions = {},
    } = params;

    app._subscriptions[namespace] = subscriptions;

    app._reducers[namespace] = buildReducers(namespace, state, reducers);

    app._effects.push(buildEffects(effects, namespace))
  }

  function start(container) {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
      combineReducers(app._reducers),
      applyMiddleware(sagaMiddleware)
    )

    app._effects.forEach(sagaMiddleware.run);

    buildSubscriptions(app._subscriptions, store)

    ReactDOM.render(
      getProvider(store, app._router()), document.querySelector(container)
    )
  }
}