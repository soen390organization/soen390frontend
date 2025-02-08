import { TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomePage],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  it('should create the HomePage component', () => {
    expect(component).toBeTruthy();
  });

  it('should have the title "Home Page"', () => {
    expect(component.title).toBe('Home Page');
  });
});
