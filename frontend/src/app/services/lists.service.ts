import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoardList, CreateListDto } from '../models';

@Injectable({ providedIn: 'root' })
export class ListsService {
  private readonly http = inject(HttpClient);

  getByBoard(boardId: string): Observable<BoardList[]> {
    return this.http.get<BoardList[]>(`/api/boards/${boardId}/lists`);
  }

  create(boardId: string, dto: CreateListDto): Observable<BoardList> {
    return this.http.post<BoardList>(`/api/boards/${boardId}/lists`, dto);
  }

  update(id: string, dto: { title?: string; position?: number }): Observable<BoardList> {
    return this.http.put<BoardList>(`/api/lists/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/lists/${id}`);
  }

  reorder(boardId: string, orderedIds: string[]): Observable<BoardList[]> {
    return this.http.patch<BoardList[]>(`/api/boards/${boardId}/lists/reorder`, { orderedIds });
  }
}
