import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehiculosComponent } from './pages/vehiculos/vehiculos.component';
import { APP_BASE_HREF } from '@angular/common';
import { AuthGuard } from 'src/_guards/auth.guard';

const routes: Routes = [
  {
    path: "vehiculos",
    canActivate: [AuthGuard],
    component: VehiculosComponent
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
