import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map, mergeMap, retry } from 'rxjs/operators';
import { HttpErrorManager } from './errorManager'
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * This class manage the http connections with internal REST services. Use the response format {
 *  Code: 'xxxxx',
 *  Body: 'Some Data' (this element is returned if the request is success)
 *  ...
 * }
 */
interface HeaderObject {
  headers: HttpHeaders;
}

@Injectable({
  providedIn: 'root',
})

export class RequestManager {
  private path!: any;
  private headerSubject = new BehaviorSubject<HeaderObject>({
    headers: new HttpHeaders()
  });
  public header$ = this.headerSubject.asObservable();
  public httpOptions: any;
  constructor(private http: HttpClient, private errManager: HttpErrorManager) {
    const acces_token = window.localStorage.getItem('access_token');
    if (acces_token !== null) {
      this.headerSubject.next({
        headers: new HttpHeaders({
          'Accept': 'application/json',
          'Authorization': `Bearer ${acces_token}`,
        }),
      });
    }
  }


  /**
   * Use for set the source path of the service (service's name must be present at src/environment/environment.ts)
   * @param service: string
   */
  public setPath(service: string) {
    this.path = environment[service as keyof typeof environment];
  }


  /**
   * Perform a GET http request
   *
   * @param endpoint service's end-point
   * @param params (an Key, Value object with que query params for the request)
   * @returns Observable<any>
   */
  get(endpoint: undefined): Observable<any> {
    return this.header$.pipe(
      mergeMap(headerObj => {
        // Accede a los headers desde el objeto que emite el BehaviorSubject
        const headers = headerObj['headers'];
        // Verifica que los headers existen antes de continuar
        if (!headers) {
          throw new Error('Headers not found');
        }
        // Crea el objeto de opciones con los headers y observe
        const options = {
          headers: headers, // Asegúrate de que headers está correctamente referenciado
          observe: 'body' as const // 'observe' fuera de los headers
        };
        // Asegúrate de retornar el Observable de la solicitud HTTP
        return this.http.get<any>(`${this.path}${endpoint}`, options).pipe(
          map((res: any) => {
            if (res.hasOwnProperty('Body')) {
              return res.Body;
            } else {
              return res;
            }
          }),
          retry(2),
          catchError(this.errManager.handleError.bind(this)),
        );
      })
    );
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post(endpoint: any, element: any): Observable<any> {
    return this.header$.pipe(
      mergeMap(headerObj => {
        // Accede a los headers desde el objeto que emite el BehaviorSubject
        const headers = headerObj.headers;
        // Crea el objeto de opciones con los headers
        const options = {
          headers: headers
        };
        // Realiza la solicitud HTTP POST
        return this.http.post<any>(`${this.path}${endpoint}`, element, options).pipe(
          catchError(this.errManager.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Perform a PUT http request
   * @param endpoint service's end-point
   * @param element data to send as JSON, With the id to UPDATE
   * @returns Observable<any>
   */
  put(endpoint: any, element: { Id: any }): Observable<any> {
    const path = (element.Id) ? `${this.path}${endpoint}/${element.Id}` : `${this.path}${endpoint}`;

    return this.header$.pipe(
      mergeMap(headerObj => {
        // Accede a los headers desde el objeto que emite el BehaviorSubject
        const headers = headerObj.headers;

        // Crea el objeto de opciones con los headers
        const options = {
          headers: headers
        };

        // Realiza la solicitud HTTP PUT
        return this.http.put<any>(path, element, options).pipe(
          catchError(this.errManager.handleError.bind(this))
        );
      })
    );
  }

  /**
   * Perform a DELETE http request
   * @param endpoint service's end-point
   * @param id element's id for remove
   * @returns Observable<any>
   */
  delete(endpoint: any, id: any): Observable<any> {
    return this.header$.pipe(
      mergeMap(headerObj => {
        // Accede a los headers desde el objeto que emite el BehaviorSubject
        const headers = headerObj.headers;

        // Crea el objeto de opciones con los headers
        const options = {
          headers: headers
        };

        // Realiza la solicitud HTTP DELETE
        return this.http.delete<any>(`${this.path}${endpoint}/${id}`, options).pipe(
          catchError(this.errManager.handleError.bind(this))
        );
      })
    );
  }
};