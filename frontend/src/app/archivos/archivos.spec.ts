import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Archivos } from './archivos';

describe('Archivos', () => {
  let component: Archivos;
  let fixture: ComponentFixture<Archivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Archivos],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Archivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
