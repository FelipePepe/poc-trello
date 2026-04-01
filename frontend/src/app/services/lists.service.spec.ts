import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ListsService } from './lists.service';

describe('ListsService', () => {
  let service: ListsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ListsService],
    });
    service = TestBed.inject(ListsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getByBoard should call nested list endpoint', () => {
    service.getByBoard('b1').subscribe();
    const req = httpMock.expectOne('/api/boards/b1/lists');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('reorder should PATCH orderedIds', () => {
    service.reorder('b1', ['l1', 'l2']).subscribe();
    const req = httpMock.expectOne('/api/boards/b1/lists/reorder');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ orderedIds: ['l1', 'l2'] });
    req.flush([]);
  });

  it('create should POST nested list payload', () => {
    service.create('b1', { title: 'Todo' }).subscribe();
    const req = httpMock.expectOne('/api/boards/b1/lists');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Todo' });
    req.flush({ id: 'l1' });
  });

  it('update should PUT list payload', () => {
    service.update('l1', { title: 'Done', position: 1 }).subscribe();
    const req = httpMock.expectOne('/api/lists/l1');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'l1' });
  });

  it('delete should call list endpoint', () => {
    service.delete('l1').subscribe();
    const req = httpMock.expectOne('/api/lists/l1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
