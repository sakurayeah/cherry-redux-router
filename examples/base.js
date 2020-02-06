import dva, { connect } from '../dva';
import React from '../dva/react';
import $ from 'jquery';
import { HashRouter, Route, Switch } from '../dva/router';


// ajax 方法封装
const ajax = (opts) => {
  $.ajax({
    url: opts.url,
    type: opts.type || 'GET',
    success: (d) => {
      opts.ok && opts.ok(d);
    },
    error: (d) => {
      opts.fail && opts.fail(d);
    }
  })
}

// requires
const requires = (url, opts = {}) => {
  return new Promise((resolve, reject) => {
    ajax({
      url,
      data: opts.data || {},
      ok: (d = {}) => resolve(d)
    })
  });
}

// services
const services = {
  init: (opts) => {
    return requires('/init.json');
  },
  change: (opts) => {
    return requires('/change.json', {});
  }
}


// -------- App start ----------

class App extends React.Component {
  render() {
    const { states, dispatch, history } = this.props;
    return (
      <div>
        <h2>{states.title}</h2>
        <button onClick={() => { history.push('/user') }}>to user</button>
        <button onClick={() => { history.push('/book') }}>to book</button>
        <p>number: {states.num}</p>
        <button onClick={() => dispatch({ type: 'app/add' })}>+</button>
        <button onClick={() => dispatch({ type: 'app/minus' })}>-</button>
        <hr />
        <div>des: {states.des}</div>
        <button onClick={() => { dispatch({ type: 'app/update', payload: { des: 'update' } }) }}>update</button>
        <button onClick={() => { dispatch({ type: 'app/change', payload: { des: 'change' } }) }}>change</button>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    states: state.app
  };
}

const AppRedux = connect(mapStateToProps)(App);


// -------- App end ----------


// -------- User start ----------
class User extends React.Component {
  render() {
    const { history, states } = this.props;
    return (
      <div>
        <h2>{states.title}</h2>
        <button onClick={() => { history.push('/') }}>to app</button>
        <button onClick={() => { history.push('/book') }}>to book</button>
      </div>
    )
  }
}

function mapStateToPropsUser(state) {
  return {
    states: state.user
  };
}

const UserRedux = connect(mapStateToPropsUser)(User);
// -------- User end ----------


// -------- Book start ----------
class Book extends React.Component {
  render() {
    return (<div>Book</div>)
  }
}
// -------- Book end ----------



// 初始化
const app = dva();

app.model({
  namespace: 'app',
  state: {
    num: 0,
    title: 'title',
    des: '',
  },
  subscriptions: {
    initialize({ dispatch, history }) {
      // dispatch({ type: 'update', payload: { title: 'subscriptions' } });
      dispatch({type: 'init'})
    },
  },
  effects: {
    *init(action, saga) {
      const { put, call } = saga;
      const res = yield call(services.init);
      yield put({
        type: 'update',
        payload: res,
      })
    },
    *change(action, saga) {
      const { put, call } = saga;
      const res = yield call(services.change);
      yield put({
        type: 'update',
        payload: res,
      })
    },
  },
  reducers: {
    add(state, action) {
      const num = state.num + 1
      return { ...state, num }
    },
    minus(state, action) {
      const num = state.num - 1
      return { ...state, num }
    },
    update(state, action) {
      const { payload = {} } = action;
      return { ...state, ...payload }
    }
  },
});

app.model({
  namespace: 'user',
  state: {
    title: 'user',
  },
  effects: {
    *change(action, sage) {
      console.log('user change')
    }
  },
})

app.router(() =>
  <HashRouter>
    <Switch>
      <Route exact path="/" component={AppRedux} />
      <Route exact path="/user" component={UserRedux} />
      <Route exact path="/book" component={Book} />
    </Switch>
  </HashRouter>
);

app.start('#root');

