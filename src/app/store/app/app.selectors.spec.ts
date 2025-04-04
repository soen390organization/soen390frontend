import {
  selectAppState,
  selectShowRoute,
  selectSelectedCampus,
  selectCurrentMap
} from './app.selectors';
import { AppState } from './app.reducer';
import { MapType } from 'src/app/enums/map-type.enum';

describe('App Selectors', () => {
  const mockAppState: AppState = {
    showRoute: true,
    selectedCampus: 'Main Campus',
    currentMap: MapType.Outdoor
  };

  const mockRootState = {
    app: mockAppState
  };

  it('should select the app state', () => {
    const result = selectAppState(mockRootState);
    expect(result).toEqual(mockAppState);
  });

  it('should select showRoute', () => {
    const result = selectShowRoute.projector(mockAppState);
    expect(result).toBe(true);
  });

  it('should select selectedCampus', () => {
    const result = selectSelectedCampus.projector(mockAppState);
    expect(result).toBe('Main Campus');
  });

  it('should select currentMap', () => {
    const result = selectCurrentMap.projector(mockAppState);
    expect(result).toBe(MapType.Outdoor);
  });
});
