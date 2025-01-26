import { ActionReducerMap } from '@ngrx/store';
import { userReducer, UserState, UserEffects } from './user';

export interface AppState {
  user: UserState;
}

export const reducers: ActionReducerMap<AppState> = {
  user: userReducer,
};

export const effects = [UserEffects];