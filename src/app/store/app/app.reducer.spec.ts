import { appReducer, initialState } from './app.reducer';
import { setSelectedCampus, setMapType, setShowRoute } from './app.actions';
import { MapType } from 'src/app/enums/map-type.enum';

describe('App Reducer', () => {
  it('should return the initial state for an unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;
    const state = appReducer(initialState, action);
    expect(state).toEqual(initialState);
  });

  it('should update selectedCampus when setSelectedCampus action is dispatched', () => {
    const campus = 'loy';
    const action = setSelectedCampus({ campus });
    const state = appReducer(initialState, action);
    expect(state.selectedCampus).toBe(campus);
    expect(state.currentMap).toBe(initialState.currentMap);
  });

  it('should update currentMap when setMapType action is dispatched', () => {
    const newMapType = MapType.Indoor;
    const action = setMapType({ mapType: newMapType });
    const state = appReducer(initialState, action);
    expect(state.currentMap).toBe(newMapType);
    expect(state.selectedCampus).toBe(initialState.selectedCampus);
  });

  it('should update showRoute when setShowRoute action is dispatched', () => {
    const show = true;
    const action = setShowRoute({ show });
    const state = appReducer(initialState, action);
    expect(state.showRoute).toBe(show);
    expect(state.selectedCampus).toBe(initialState.selectedCampus);
    expect(state.currentMap).toBe(initialState.currentMap);
  });
});
