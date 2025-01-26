import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

// Feature selector for the UserState
export const selectUserState = createFeatureSelector<UserState>('user');

// Selector for the user object
export const selectUser = createSelector(
  selectUserState,
  (state: UserState) => state.user
);

// Selector for the user's loading state
export const selectUserLoading = createSelector(
  selectUserState,
  (state: UserState) => state.loading
);

// Selector for the user's error state
export const selectUserError = createSelector(
  selectUserState,
  (state: UserState) => state.error
);

// Selector for the user's name
export const selectUserName = createSelector(
  selectUser,
  (user) => user?.name || null
);

// Selector for the user's email
export const selectUserEmail = createSelector(
  selectUser,
  (user) => user?.email || null
);

// Example: Derived selector to check if a user is logged in
export const selectIsUserLoggedIn = createSelector(
  selectUser,
  (user) => !!user
);
