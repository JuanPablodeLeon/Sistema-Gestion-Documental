import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Buscar } from './buscar';

describe('Buscar', () => {
  let component: Buscar;
  let fixture: ComponentFixture<Buscar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscar],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Buscar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
