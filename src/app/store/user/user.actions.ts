import { createAction, props } from '@ngrx/store';

export const loadUser = createAction('[User] Load User');

export const loadUserSuccess = createAction(
  '[User] Load User Success',
  props<{ user: { id: string; name: string; email: string } }>()
);

export const loadUserFailure = createAction(
  '[User] Load User Failure',
  props<{ error: any }>()
);

export const setUserName = createAction(
  '[User] Successfully set User',
  props<{ name: string; }>()
);
