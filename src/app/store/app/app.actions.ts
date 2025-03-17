import { createAction, props } from '@ngrx/store';
import { MapType } from 'src/app/enums/map-type.enum';
import { CalendarEvent } from 'src/app/interfaces/event.interface';

export const setSelectedCampus = createAction(
  '[App] Set Selected Campus',
  props<{ campus: string }>()
);

export const setMapType = createAction('[App] Set Map Type', props<{ mapType: MapType }>());

export const setCurrentCalendar = createAction('[App] Set Current Caledar', props<{ newCalendar: CalendarEvent[] }>());
