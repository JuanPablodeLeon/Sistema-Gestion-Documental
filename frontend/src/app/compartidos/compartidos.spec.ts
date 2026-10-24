import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Compartidos } from './compartidos';

describe('Compartidos', () => {
  let component: Compartidos;
  let fixture: ComponentFixture<Compartidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Compartidos],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Compartidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
