import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Comentarios } from './comentarios';

describe('Comentarios', () => {
  let component: Comentarios;
  let fixture: ComponentFixture<Comentarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comentarios],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Comentarios);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tipo', 'archivo');
    fixture.componentRef.setInput('recursoId', '000000000000000000000000');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
