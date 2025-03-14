import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarListComponent } from './calendar-list.component';
import { CalendarService } from 'src/app/services/calendar/calendar.service';
import { of } from 'rxjs';
import { IonicModule } from '@ionic/angular';

class MockCalendarService {
  calendars$ = of([{ id: 'test-cal-1', summary: 'Test Calendar' }]);
  selectedCalendar$ = of('test-cal-1');
  setSelectedCalendar(calendarId: string) {}
}

describe('CalendarListComponent', () => {
  let component: CalendarListComponent;
  let fixture: ComponentFixture<CalendarListComponent>;
  let mockService: MockCalendarService;

  beforeEach(async () => {
    mockService = new MockCalendarService();

    await TestBed.configureTestingModule({
      imports: [IonicModule, CalendarListComponent],
      providers: [{ provide: CalendarService, useValue: mockService }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load and subscribe to calendars', () => {
    expect(component.calendars.length).toBe(1);
    expect(component.calendars[0].id).toBe('test-cal-1');
  });

  it('should listen for selected calendar changes', () => {
    expect(component.selectedCalendar).toBe('test-cal-1');
  });

  it('should call setSelectedCalendar when selectCalendar is invoked', () => {
    spyOn(mockService, 'setSelectedCalendar');
    component.selectCalendar('new-cal');
    expect(mockService.setSelectedCalendar).toHaveBeenCalledWith('new-cal');
  });
});
