import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehiculoBusqueda } from '../../../../models/vehiculo-busqueda.models'
import { Vinculacion } from '../../../../models/vinculacion.models'
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OikosService } from 'src/app/services/oikos.service';
import { catchError, of, tap } from 'rxjs';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { DocumentosService } from 'src/app/services/documentos.service';
import { TercerosService } from 'src/app/services/terceros.service';

// @ts-ignore
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-editar-vehiculo-dialog',
  templateUrl: './editar-vehiculo-dialog.component.html',
  styleUrls: ['./editar-vehiculo-dialog.component.css']
})
export class EditarVehiculoDialogComponent {
  tipo: string;
  id_gedep: string;
  element: VehiculoBusqueda;
  VehiculoForm !: FormGroup;
  documentoIdentidad: any;
  vinculaciones: any[];
  objVehiculo: any;
  vinculacion: Vinculacion;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EditarVehiculoDialogComponent>,
   
    private popUpManager: PopUpManager,
    private translate: TranslateService,
    private documentosService: DocumentosService,
    private terceroService: TercerosService,
    private oikosService: OikosService
  ) {
    // Establece el idioma por defecto a español
    translate.setDefaultLang('es');
    // Inicializa variables
    this.id_gedep = '';
    this.tipo = data.tipo;
    this.element = data.element;
    this.objVehiculo = {};
    this.vinculaciones = [];
    this.vinculacion = {} as Vinculacion;
    // Inicializa el formulario
    this.iniciarFormularioConsulta();
    // Carga información del documento de identidad
    this.cargarDocumentoIdentidad();
    this.cargarVinculaciones();
  }
  iniciarFormularioConsulta() {
    this.VehiculoForm = new FormGroup({
      placa: new FormControl('', [Validators.required, Validators.pattern('^[A-Z]+$')])
    });
  }
  // Función para cargar el documento de identidad del tercero
  cargarDocumentoIdentidad() {
    this.terceroService.get('datos_identificacion?query=TerceroId.Id:' + this.element.terceroId + ',TipoDocumentoId.CodigoAbreviacion:CC').subscribe((documento: any) => {
      console.log('documento:', documento);
      if (documento && documento.length > 0) {

        this.documentoIdentidad = documento[0].Numero;

      }

    }),
      catchError((error) => {
        Swal.close();
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.BUSQUEDA.BUSQUEDA') + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));


        return of(null);
      })
  }
  // Función para cargar las vinculaciones activas del tercero  
  cargarVinculaciones() {
    this.terceroService.get('vinculacion?query=TerceroPrincipalId.Id:' + this.element.terceroId + ',Activo:true').subscribe((datosInfoVinculaciones: any) => {
      console.log('vinculaciones:', datosInfoVinculaciones);
      this.vinculaciones = datosInfoVinculaciones;
      for (let i = 0; i < this.vinculaciones.length; i++) {
        this.vinculaciones[i] = {
          ...datosInfoVinculaciones[i],
          ...{ FechaInicioVinculacion: this.vinculaciones[i].FechaInicioVinculacion ? this.corregirFecha(this.vinculaciones[i].FechaInicioVinculacion) : '' },
          ...{ FechaFinVinculacion: this.vinculaciones[i].FechaFinVinculacion ? this.corregirFecha(this.vinculaciones[i].FechaFinVinculacion) : '' }
        }
        if (JSON.stringify(this.vinculaciones[i]) !== '{}') {
          if (this.vinculaciones[i].DependenciaId) {
            this.oikosService.get(`dependencia/` + this.vinculaciones[i].DependenciaId).subscribe((dependencia: any) => {
                this.vinculaciones[i].Dependencia = dependencia.Nombre;

              }, (error) => {
                console.log(error);
              })
          }
          this.asignarVinculacion(this.vinculaciones[i]);


        }
      }
      console.log(this.vinculaciones);


    }),
      catchError((error) => {
        Swal.close();
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.BUSQUEDA.BUSQUEDA') + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));


        return of(null);
      })
  }
  corregirFecha(fecha: string): Date {
    let fechaHora = new Date(fecha);
    fechaHora.setHours(fechaHora.getHours() + 5);
    return fechaHora;
  }
  /**
   * Función para ver un documento específico.
   * @param uidDocumento Identificador único del documento a visualizar.
   */
  verDocumento(uidDocumento: string) {
    console.log('uidDocumento:', uidDocumento);

    this.documentosService.get('document/' + uidDocumento).subscribe((documento: any) => {
      if (documento && documento.file) {
        const byteCharacters = atob(documento.file);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blob);

        window.open(fileURL, '_blank');

      }

    }),
      catchError((error) => {
        Swal.close();
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.BUSQUEDA.BUSQUEDA') + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));


        return of(null);
      })
  }


  gestorAccionTipo() {
    if (this.tipo == "ACTIVAR") {
      this.activarVehiculo();
    } else {
      this.editarVehiculo();
    }
  }

  crearObjetoMapeo() {
    if (this.tipo == "ACTIVAR") {
      return {
        id: this.element.id,
        activo: this.element.estado === 'ACTIVO' ? false : true
      }
    } else {
      return {
        id: this.element.id


      }
    }
  }

  activarVehiculo() {
    this.popUpManager.showConfirmAlert(this.translate.instant('CONFIRMACION.ACTIVAR.PREGUNTA'), this.translate.instant('CONFIRMACION.ACTIVAR.CONFIRMAR'), this.translate.instant('CONFIRMACION.ACTIVAR.DENEGAR')).then((result) => {
      console.log('result:', result);
      if (result === true && this.element.estado === 'NO ACTIVO') {

        // Si el usuario confirma, se procede a activar el vehículo
        this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.ACTIVAR_VEHICULO'));
        this.cambioEstadoVehiculo(this.element.id, true).then(() => {
          Swal.close();
          this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.ACTIVAR_VEHICULO'));
        }).catch((error) => {
          Swal.close();
          this.popUpManager.showErrorAlert(this.translate.instant('ERROR.ACTIVAR_VEHICULO') + ":" + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));
        });

      } else if (result === false && this.element.estado === 'ACTIVO') {
        // Si el usuario deniega, se muestra inactiva el vehiculo
        this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.ACTIVAR_VEHICULO'));
        this.cambioEstadoVehiculo(this.element.id, false).then(() => {
          Swal.close();
          this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.ACTIVAR_VEHICULO'));
        }).catch((error) => {
          Swal.close();
          this.popUpManager.showErrorAlert(this.translate.instant('ERROR.ACTIVAR_VEHICULO') + ":" + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));
        });

      } else {
        // Si el usuario cancela, no se realiza ninguna acción y se muestra un mensaje de error
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.ACTIVAR_VEHICULO'));
      }
    })
  }
  cambioEstadoVehiculo(id: number, estado: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this.terceroService.get('info_complementaria_tercero/' + id).subscribe((infoComplementaria: any) => {
        if (infoComplementaria) {
          console.log('infoComplementaria:', infoComplementaria);
          this.objVehiculo = infoComplementaria;
          this.objVehiculo.Activo = estado;

          this.terceroService.put('info_complementaria_tercero', this.objVehiculo).pipe(
            tap((res: any) => {
              console.log('res:', res);
              if (res && res.Activo === estado) {
                resolve();
              } else {
                reject(new Error('No se pudo cambiar el estado del vehículo.'));
              }
            }),
            catchError((error) => {
              console.error('Error en la solicitud', error);
              reject(error);
              return of(null);
            })
          ).subscribe();
        } else {
          reject(new Error('No se encontró la información complementaria del vehículo.'));
        }
      });
    });
  }
  asignarVinculacion(vinculacion: Vinculacion) {
    let idRol: number = vinculacion.TipoVinculacionId;


    if (idRol == 290 || idRol == 291) {
      vinculacion.TipoVinculacion = 'CONTRATISTA';
    }
    if (idRol == 346) {
      vinculacion.TipoVinculacion = 'ESTUDIANTE';
    }
    if (idRol == 300 || idRol == 301 || idRol == 302 || idRol == 303 || idRol == 304 || idRol == 305 || idRol == 306 || idRol == 307 || idRol == 311 || idRol == 347) {
      vinculacion.TipoVinculacion = 'FUNCIONARIO';
    }
    if (idRol == 292 || idRol == 293 || idRol == 294 || idRol == 295 || idRol == 296 || idRol == 297 || idRol == 298 || idRol == 299) {
      vinculacion.TipoVinculacion = 'DOCENTE';
    }
    if (idRol == 377 ) {
      vinculacion.TipoVinculacion = 'CONTRATISTA EXTERNO';
    }
  }
  editarVehiculo() {
    /*
    this.popUpManager.showConfirmAlert(this.translate.instant('CONFIRMACION.EDITAR_VEHICULO.PREGUNTA'), this.translate.instant('CONFIRMACION.EDITAR_VEHICULO.CONFIRMAR'), this.translate.instant('CONFIRMACION.EDITAR_VEHICULO.DENEGAR')).then((result) => {
      if (result === true) {
        this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.EDITAR_MAPEO'));
        const objMapeo = this.crearObjetoMapeo();
        this.dependenciasService.put('mapeo_dependencia/' + this.element.id, objMapeo).pipe(
          tap((res: any) => {
            if (res.mapeo_dependencias?.id_master) {
              Swal.close();
              this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.EDITAR_MAPEO'));
            } else {
              Swal.close();
              this.popUpManager.showErrorAlert(this.translate.instant('ERROR.EDITAR_MAPEO'));
            }
          }),
          catchError((error) => {
            console.error('Error en la solicitud', error);
            Swal.close();
            this.popUpManager.showErrorAlert(this.translate.instant('ERROR.EDITAR_MAPEO') + ":" + (error.message || this.translate.instant('ERROR.EDITAR_MAPEO')));
            return of(null);
          })
        ).subscribe();
        this.dialogRef.close();
      }
    })*/
  }

  onCloseClick() {
    this.dialogRef.close();
  }
}
