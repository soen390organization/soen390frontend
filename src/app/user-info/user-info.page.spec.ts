import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInfoPage } from './user-info.page';

describe('UserInfoPage', () => {
  let component: UserInfoPage;
  let fixture: ComponentFixture<UserInfoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
