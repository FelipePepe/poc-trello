import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CustomFieldsService } from './custom-fields.service';

describe('CustomFieldsService', () => {
  let service: CustomFieldsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CustomFieldsService],
    });
    service = TestBed.inject(CustomFieldsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('create should POST custom field on board endpoint', () => {
    service.create('b1', { name: 'Priority', type: 'select', options: ['High'] }).subscribe();
    const req = httpMock.expectOne('/api/boards/b1/custom-fields');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'f1' });
  });

  it('deleteValue should DELETE card field value endpoint', () => {
    service.deleteValue('c1', 'f1').subscribe();
    const req = httpMock.expectOne('/api/cards/c1/field-values/f1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getByBoard should GET board fields', () => {
    service.getByBoard('b1').subscribe();
    const req = httpMock.expectOne('/api/boards/b1/custom-fields');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('update should PUT custom field payload', () => {
    service.update('f1', { name: 'Severity' }).subscribe();
    const req = httpMock.expectOne('/api/custom-fields/f1');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'f1' });
  });

  it('delete should DELETE custom field', () => {
    service.delete('f1').subscribe();
    const req = httpMock.expectOne('/api/custom-fields/f1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('upsertValue should PUT card field value payload', () => {
    service.upsertValue('c1', 'f1', { value: 'High' }).subscribe();
    const req = httpMock.expectOne('/api/cards/c1/field-values/f1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ value: 'High' });
    req.flush({ cardId: 'c1', fieldId: 'f1', value: 'High' });
  });
});
