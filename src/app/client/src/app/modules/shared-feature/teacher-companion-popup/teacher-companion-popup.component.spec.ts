import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherCompanionPopupComponent } from './teacher-companion-popup.component';

describe('TeacherCompanionPopupComponent', () => {
  let component: TeacherCompanionPopupComponent;
  let fixture: ComponentFixture<TeacherCompanionPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeacherCompanionPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherCompanionPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
