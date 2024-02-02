import { Injectable } from '@angular/core'
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { Observable, of } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { WidgetUserService } from '@sunbird-cb/collection'
import { ConfigurationsService } from '@sunbird-cb/utils'

@Injectable()
export class Profilev2CerficatesResolve
  implements
  Resolve<any> {
  constructor(private configSvc: ConfigurationsService, private userSvc: WidgetUserService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<any> {
    const userId = this.configSvc.userProfile && this.configSvc.userProfile.userId || ''

    return this.userSvc.fetchProfileUserBatchList(userId).pipe(
      map(data =>  ({ data, error: null })),
      catchError(error => of({ error, data: null })),
    )
  }
}
