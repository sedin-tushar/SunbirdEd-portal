import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ModalWrapperComponent, ModalContentDirective } from './modal-wrapper.component';

describe('ModalWrapperComponent', () => {
  let component: ModalWrapperComponent;
  let fixture: ComponentFixture<ModalWrapperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalWrapperComponent, ModalContentDirective],
      imports: [MatDialogModule],
      providers: [Overlay],
    });

    fixture = TestBed.createComponent(ModalWrapperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


});
