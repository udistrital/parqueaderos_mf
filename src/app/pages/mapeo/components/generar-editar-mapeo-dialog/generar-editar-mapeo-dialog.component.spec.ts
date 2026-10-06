import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarEditarMapeoDialogComponent } from './generar-editar-mapeo-dialog.component';

describe('GenerarEditarMapeoDialogComponent', () => {
  let component: GenerarEditarMapeoDialogComponent;
  let fixture: ComponentFixture<GenerarEditarMapeoDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GenerarEditarMapeoDialogComponent]
    });
    fixture = TestBed.createComponent(GenerarEditarMapeoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
