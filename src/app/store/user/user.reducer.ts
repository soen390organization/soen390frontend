import { createReducer, on } from '@ngrx/store';
import { loadUser, loadUserSuccess, loadUserFailure, setUserName } from './user.actions';

export interface UserState {
  user: { id: string; name: string; email: string } | null;
  loading: boolean;
  error: any;
}

export const initialState: UserState = {
  user: null,
  loading: false,
  error: null
};

export const userReducer = createReducer(
  initialState,
  on(loadUser, (state) => ({ ...state, loading: true })),
  on(loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false
  })),
  on(loadUserFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  on(setUserName, (state, { name }) => ({
    ...state,
    user: state.user ? { ...state.user, name } : null
  }))
);
