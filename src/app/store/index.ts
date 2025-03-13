import { ActionReducerMap } from '@ngrx/store';
import { userReducer, UserState, UserEffects } from './user';
import { appReducer, AppState } from './app';

export interface GlobalState {
  user: UserState;
  app: AppState;
}

export const reducers: ActionReducerMap<GlobalState> = {
  user: userReducer,
  app: appReducer,
};

export const effects = [UserEffects];
