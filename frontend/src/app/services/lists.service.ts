import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoardList, CreateListDto } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ListsService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getByBoard(boardId: string): Observable<BoardList[]> {
    return this.http.get<BoardList[]>(`${this.api}/api/boards/${boardId}/lists`);
  }

  create(boardId: string, dto: CreateListDto): Observable<BoardList> {
    return this.http.post<BoardList>(`${this.api}/api/boards/${boardId}/lists`, dto);
  }

  update(id: string, dto: { title?: string; position?: number }): Observable<BoardList> {
    return this.http.put<BoardList>(`${this.api}/api/lists/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/lists/${id}`);
  }

  reorder(boardId: string, orderedIds: string[]): Observable<BoardList[]> {
    return this.http.patch<BoardList[]>(`${this.api}/api/boards/${boardId}/lists/reorder`, {
      orderedIds,
    });
  }
}
