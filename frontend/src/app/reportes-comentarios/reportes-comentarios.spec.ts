import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ReportesComentarios } from './reportes-comentarios';

describe('ReportesComentarios', () => {
  let component: ReportesComentarios;
  let fixture: ComponentFixture<ReportesComentarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesComentarios],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesComentarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
