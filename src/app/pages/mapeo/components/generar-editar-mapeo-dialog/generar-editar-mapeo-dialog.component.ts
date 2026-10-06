import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';
import { MapeoBusqueda } from './../../../../models/mapeo-busqueda.models'
import { OikosMidService } from './../../../../services/oikos_mid.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Dependencias_service } from 'src/app/services/dependencias.service';
import { catchError, of, tap } from 'rxjs';
import { PopUpManager } from 'src/app/managers/popUpManager';
// @ts-ignore
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-generar-editar-mapeo-dialog',
  templateUrl: './generar-editar-mapeo-dialog.component.html',
  styleUrls: ['./generar-editar-mapeo-dialog.component.css']
})
export class GenerarEditarMapeoDialogComponent {
  tipo: string;
  id_gedep: string;
  element: MapeoBusqueda;

  MapeoForm = new FormGroup({
    nombre: new FormControl<string | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    idArgo: new FormControl<string | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    numIdInterno: new FormControl<string | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    codSnies: new FormControl<string | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    codIris: new FormControl<string | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
  })

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<GenerarEditarMapeoDialogComponent>,
    private oikosmid: OikosMidService,
    private dependencias_service: Dependencias_service,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
  ) {
    translate.setDefaultLang('es');
    this.id_gedep = '';
    this.tipo = data.tipo;
    this.element = data.element;
    this.cargarDatosMapeoDependencia();
  }

  cargarDatosMapeoDependencia(){
    this.MapeoForm.get('nombre')?.setValue(this.element.nombre);
    this.MapeoForm.get('numIdInterno')?.setValue(String(this.element.id));
    this.MapeoForm.controls['numIdInterno'].disable();
    if (this.tipo != "GENERAR"){
      this.dependencias_service.get('mapeo_dependencia/'+this.element.id).subscribe((res:any)=>{
        let dataRes = res.mapeo_dependencias_pruebasCollection.mapeo_dependencias_pruebas;
        dataRes = dataRes[0];
        // this.MapeoForm.controls['numIdInterno'].disable();
        this.MapeoForm.get('idArgo')?.setValue(dataRes.id_argo);
        // this.MapeoForm.get('numIdInterno')?.setValue(dataRes.id_master);
        this.MapeoForm.get('codSnies')?.setValue(dataRes.id_acad);
        this.MapeoForm.get('codIris')?.setValue(dataRes.id_iris);
        if(dataRes.id_gedep == null){
          let temp = dataRes.id_argo;
          temp = temp.split("P");
          this.id_gedep = temp[1];
        }else{
          this.id_gedep = dataRes.id_gedep
        }
      });
    }
  }

  gestorAccionTipo(){
    if (this.tipo == "GENERAR"){
      this.creacionMapeoDependencia();
    }else{
      this.editarMapeoDependencia();
    }
  }

  crearObjetoMapeo(){
    this.MapeoForm.controls['numIdInterno'].enable();
    const valoresForm = this.MapeoForm.value;
    if(this.id_gedep == '' && valoresForm.idArgo){
      let temp: any = valoresForm.idArgo;
      temp = temp.split("P");
      this.id_gedep = temp[1];
    }else{
      this.id_gedep = this.id_gedep;
    }
    if (this.tipo == "GENERAR"){
      return {
        _postmapeo_dependencia:{
          id_master: Number(valoresForm.numIdInterno),
          id_gedep: Number(this.id_gedep),
          id_argo: valoresForm.idArgo,
          id_acad: Number(valoresForm.codSnies),
          id_iris: Number(valoresForm.codIris)
        }
      }
    }else{
      return {
        _putmapeo_dependencia_id_master:{
          id_master: Number(valoresForm.numIdInterno),
          id_gedep: Number(this.id_gedep),
          id_argo: valoresForm.idArgo,
          id_acad: Number(valoresForm.codSnies),
          id_iris: Number(valoresForm.codIris)
        }
      }
    }
  }

  creacionMapeoDependencia(){
    this.popUpManager.showConfirmAlert(this.translate.instant('CONFIRMACION.GENERAR_MAPEO.PREGUNTA'),this.translate.instant('CONFIRMACION.GENERAR_MAPEO.CONFIRMAR'),this.translate.instant('CONFIRMACION.GENERAR_MAPEO.DENEGAR')).then((result) =>{
      if (result === true){
        this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.GENERAR_MAPEO'));
        const objMapeo = this.crearObjetoMapeo();
        this.dependencias_service.post('mapeo_dependencia', objMapeo).pipe(
          tap((res:any)=>{
            if (res.mapeo_dependencias?.id_master){
              Swal.close();
              this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.GENERAR_MAPEO'));
            } else{
              Swal.close();
              this.popUpManager.showErrorAlert(this.translate.instant('ERROR.GENERAR_MAPEO'));
            }
          }),
          catchError((error)=>{
            console.error('Error en la solicitud', error);
            Swal.close();
            this.popUpManager.showErrorAlert(this.translate.instant('ERROR.GENERAR_MAPEO') + ":" + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));
            return of(null);
          })
        ).subscribe();
        this.dialogRef.close();
      }
    })
  }

  editarMapeoDependencia(){
    this.popUpManager.showConfirmAlert(this.translate.instant('CONFIRMACION.EDITAR_MAPEO.PREGUNTA'),this.translate.instant('CONFIRMACION.EDITAR_MAPEO.CONFIRMAR'),this.translate.instant('CONFIRMACION.EDITAR_MAPEO.DENEGAR')).then((result) =>{
      if (result === true){
        this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.EDITAR_MAPEO'));
        const objMapeo = this.crearObjetoMapeo();
        this.dependencias_service.put('mapeo_dependencia/'+this.element.id, objMapeo).pipe(
          tap((res:any)=>{
            if (res.mapeo_dependencias?.id_master){
              Swal.close();
              this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.EDITAR_MAPEO'));
            } else{
              Swal.close();
              this.popUpManager.showErrorAlert(this.translate.instant('ERROR.EDITAR_MAPEO'));
            }
          }),
          catchError((error)=>{
            console.error('Error en la solicitud', error);
            Swal.close();
            this.popUpManager.showErrorAlert(this.translate.instant('ERROR.EDITAR_MAPEO') + ":" + (error.message || this.translate.instant('ERROR.EDITAR_MAPEO')));
            return of(null);
          })
        ).subscribe();
        this.dialogRef.close();
      }
    })
  }

  onCloseClick(){
    this.dialogRef.close();
  }
}
