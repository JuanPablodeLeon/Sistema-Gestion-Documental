import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Carpetas } from './carpetas';

describe('Carpetas', () => {
  let component: Carpetas;
  let fixture: ComponentFixture<Carpetas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carpetas],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Carpetas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
