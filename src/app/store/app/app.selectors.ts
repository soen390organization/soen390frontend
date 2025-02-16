import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AppState } from './app.reducer';

// Feature Selector (Gets the 'app' state slice)
export const selectAppState = createFeatureSelector<AppState>('app');

// Selector to Get the Selected Campus
export const selectSelectedCampus = createSelector(
  selectAppState,
  (state: AppState) => state.selectedCampus
);
