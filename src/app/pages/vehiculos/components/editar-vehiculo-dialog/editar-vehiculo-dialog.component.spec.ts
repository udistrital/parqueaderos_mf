import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarVehiculoDialogComponent } from './editar-vehiculo-dialog.component';

describe('EditarVehiculoDialogComponent', () => {
  let component: EditarVehiculoDialogComponent;
  let fixture: ComponentFixture<EditarVehiculoDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarVehiculoDialogComponent]
    });
    fixture = TestBed.createComponent(EditarVehiculoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
