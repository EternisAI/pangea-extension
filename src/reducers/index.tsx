import { combineReducers } from 'redux';
import requests from './requests';
import history from './history';
import plugins from './plugins';
import identity from './identity2';

const rootReducer = combineReducers({
  requests,
  history,
  plugins,
  identity,
});

export type AppRootState = ReturnType<typeof rootReducer>;
export default rootReducer;
