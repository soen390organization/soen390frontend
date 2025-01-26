import { userReducer, initialState, UserState } from './user.reducer';
import { loadUser, loadUserSuccess, loadUserFailure } from './user.actions';

describe('User Reducer', () => {
  it('should set loading to true on loadUser', () => {
    const action = loadUser();
    const state = userReducer(initialState, action);

    expect(state.loading).toBeTrue();
  });

  it('should set user and loading to false on loadUserSuccess', () => {
    const user = { id: '1', name: 'John Doe', email: 'john.doe@example.com' };
    const action = loadUserSuccess({ user });
    const state = userReducer(initialState, action);

    expect(state.user).toEqual(user);
    expect(state.loading).toBeFalse();
  });

  it('should set error and loading to false on loadUserFailure', () => {
    const error = { message: 'Failed to load user' };
    const action = loadUserFailure({ error });
    const state = userReducer(initialState, action);

    expect(state.error).toEqual(error);
    expect(state.loading).toBeFalse();
  });
});
