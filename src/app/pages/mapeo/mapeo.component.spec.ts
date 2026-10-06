import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapeoComponent } from './mapeo.component';

describe('MapeoComponent', () => {
  let component: MapeoComponent;
  let fixture: ComponentFixture<MapeoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapeoComponent]
    });
    fixture = TestBed.createComponent(MapeoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
