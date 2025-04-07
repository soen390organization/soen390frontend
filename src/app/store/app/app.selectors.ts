import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from './app.reducer';

// Feature Selector (Gets the 'app' state slice)
export const selectAppState = createFeatureSelector<AppState>('app');

export const selectShowRoute = createSelector(
  selectAppState,
  (state: AppState) => state.showRoute
);

// Selector to Get the Selected Campus
export const selectSelectedCampus = createSelector(
  selectAppState,
  (state: AppState) => state.selectedCampus
);

export const selectCurrentMap = createSelector(
  selectAppState,
  (state: AppState) => state.currentMap
);
