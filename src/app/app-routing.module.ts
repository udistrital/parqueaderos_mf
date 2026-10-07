import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapeoComponent } from './pages/mapeo/mapeo.component';
import { APP_BASE_HREF } from '@angular/common';
import { AuthGuard } from 'src/_guards/auth.guard';

const routes: Routes = [
  {
    path: "mapeo",
    canActivate: [AuthGuard],
    component: MapeoComponent
  },
  {
    path: "**",
    redirectTo: "registro"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: APP_BASE_HREF, useValue: "/"}]
})
export class AppRoutingModule { }
