import { AfterViewInit, Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { MapeoBusqueda } from './../../models/mapeo-busqueda.models'
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { GenerarEditarMapeoDialogComponent } from './components/generar-editar-mapeo-dialog/generar-editar-mapeo-dialog.component'
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Desplegables } from 'src/app/models/desplegables.models';
import { OikosService } from '../../services/oikos.service';
import { OikosMidService } from '../../services/oikos_mid.service';
import { PopUpManager } from '../../managers/popUpManager'
import { Dependencias_service } from 'src/app/services/dependencias.service';
// @ts-ignore
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-mapeo',
  templateUrl: './mapeo.component.html',
  styleUrls: ['./mapeo.component.css']
})
export class MapeoComponent implements OnInit, AfterViewInit {
  @Input('normalform') normalform: any;
  @ViewChild(MatPaginator) paginator !: MatPaginator;

  tiposDependencia: Desplegables[] = [];
  facultades: Desplegables[] = [];
  vicerrectorias: Desplegables[] = [];
  mostrarTabla: boolean = false;
  cargando: boolean = false; // <-- Variable para el loader
  columnasBusqueda = signal<string[]>(["NOMBRE", "DEPENDENCIA ASOCIADAS", "TIPO", "ACCIONES"]);
  gestionForm !: FormGroup;
  elementosBusqueda = signal<MapeoBusqueda[]>([]);
  datos = new MatTableDataSource<MapeoBusqueda>();



  constructor(
    private dependencias_service: Dependencias_service,
    private oikosService: OikosService,
    public dialog: MatDialog,
    private oikosMidService: OikosMidService,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
  ) {
    translate.setDefaultLang('es');
    this.cargarTiposDependencia();
    this.cargarFacultades();
    this.cargarVicerrectorias();
  }

  ngOnInit() {
    this.iniciarFormularioConsulta();
    this.gestionForm.get('facultad')?.valueChanges.subscribe((selectedFacultad) => {
      if (selectedFacultad) {
        this.gestionForm.get('vicerrectoria')?.setValue(null);
        this.gestionForm.get('tipoDependencia')?.setValue(null);
      }
    });
    this.gestionForm.get('vicerrectoria')?.valueChanges.subscribe((selectedVicerrectoria) => {
      if (selectedVicerrectoria) {
        this.gestionForm.get('facultad')?.setValue(null);
        this.gestionForm.get('tipoDependencia')?.setValue(null);
      }
    });
    this.gestionForm.get('tipoDependencia')?.valueChanges.subscribe((selectedTipoDependencia) => {
      if (selectedTipoDependencia) {
        this.gestionForm.get('facultad')?.setValue(null);
        this.gestionForm.get('vicerrectoria')?.setValue(null);
      }
    });
  }

  ngAfterViewInit() {
    this.datos.paginator = this.paginator;
  }

  iniciarFormularioConsulta() {
    this.gestionForm = new FormGroup({
      nombre: new FormControl("", {
        nonNullable: false,
        validators: [Validators.required]
      }),
      tipoDependencia: new FormControl<Desplegables | null>(null, {
        nonNullable: true,
        validators: [Validators.required]
      }),
      facultad: new FormControl<Desplegables | null>(null, {
        nonNullable: true,
        validators: [Validators.required]
      }),
      vicerrectoria: new FormControl<Desplegables | null>(null, {
        nonNullable: true,
        validators: [Validators.required]
      }),
      estado: new FormControl<string | null>(null, {
        nonNullable: true,
        validators: [Validators.required]
      }),
    });
  }


  cargarTiposDependencia() {
    this.oikosService.get('tipo_dependencia?limit=-1').subscribe((res: any) => {
      this.tiposDependencia = res.map((item: any) => ({
        id: item.Id,
        nombre: item.Nombre
      }));
    });
  }

  cargarFacultades() {
    this.oikosService.get('dependencia?limit=-1').subscribe((res: any) => {
      this.facultades = res.filter((item: any) =>
        item.DependenciaTipoDependencia &&
        item.DependenciaTipoDependencia.some((tipoDependencia: any) =>
          tipoDependencia.TipoDependenciaId.Nombre === 'FACULTAD'
        )
      )
        .map((item: any) => ({
          id: item.Id,
          nombre: item.Nombre
        }));
    });
  }

  cargarVicerrectorias() {
    this.oikosService.get('dependencia?limit=-1').subscribe((res: any) => {
      this.vicerrectorias = res.filter((item: any) =>
        item.DependenciaTipoDependencia &&
        item.DependenciaTipoDependencia.some((tipoDependencia: any) =>
          tipoDependencia.TipoDependenciaId.Nombre === 'VICERRECTORIA'
        )
      )
        .map((item: any) => ({
          id: item.Id,
          nombre: item.Nombre
        }));
    });
  }

  abrirDialogGenerarEditarMapeo(tipo: string, element: MapeoBusqueda) {
    let validador = false;
    this.dependencias_service.get('mapeo_dependencia/' + element.id).subscribe((res: any) => {
      const collection = res?.mapeo_dependencias_pruebasCollection;

      if (collection && Object.keys(collection).length === 0) {
        // Caso 1: El objeto está vacío
        if (tipo == "GENERAR") {
          validador = true;
        } else {
          validador = false;
        }
      } else if (
        collection?.mapeo_dependencias_pruebas &&
        Array.isArray(collection.mapeo_dependencias_pruebas) &&
        collection.mapeo_dependencias_pruebas.length > 0
      ) {
        // Caso 2: El objeto tiene contenido
        if (tipo == "GENERAR") {
          validador = false;
        } else {
          validador = true;
        }
      } else {
        // Caso opcional: Ni vacío ni con contenido válido
        if (tipo == "GENERAR") {
          validador = false;
        } else {
          validador = true;
        }
      }

      if (tipo == "GENERAR" && !validador) {
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.MAPEO_EXISTENTE'));
      } else if (tipo == "EDITAR" && !validador) {
        this.popUpManager.showErrorAlert(this.translate.instant('ERROR.NO_MAPEO'));
      } else if (validador) {
        const dialogRef = this.dialog.open(GenerarEditarMapeoDialogComponent, {
          width: '70%',
          height: 'auto',
          maxHeight: '65vh',
          data: {
            tipo: tipo,
            element: element,
          }
        });
      }
    });
  }

  construirBusqueda() {
    const busqueda: any = {};

    if (this.gestionForm.value.nombre) {
      busqueda.NombreDependencia = this.gestionForm.value.nombre;
    }

    if (this.gestionForm.value.tipoDependencia?.id) {
      busqueda.TipoDependenciaId = this.gestionForm.value.tipoDependencia.id;
    }

    if (this.gestionForm.value.facultad?.id) {
      busqueda.FacultadId = this.gestionForm.value.facultad.id;
    }

    if (this.gestionForm.value.vicerrectoria?.id) {
      busqueda.VicerrectoriaId = this.gestionForm.value.vicerrectoria.id;
    }

    if (this.gestionForm.value.estado) {
      if (this.gestionForm.value.estado != '...') {
        busqueda.BusquedaEstado = {
          Estado: this.gestionForm.value.estado === "ACTIVO"
        };
      }
    }

    return busqueda;
  }

  buscarDependencias() {
    const busqueda = this.construirBusqueda();

    if (Object.keys(busqueda).length !== 0) {
      this.busqueda(busqueda).then((resultadosParciales) => {
        this.procesarResultados(resultadosParciales);
      });
    } else {
      const busquedaActiva = {
        BusquedaEstado: {
          Estado: true
        }
      };
      const busquedaInactiva = {
        BusquedaEstado: {
          Estado: false
        }
      };

      this.busqueda(busquedaActiva).then((resultadosActivos) => {
        this.busqueda(busquedaInactiva).then((resultadosInactivos) => {
          const resultadosTotales = [...resultadosActivos, ...resultadosInactivos];
          this.procesarResultados(resultadosTotales);
        });
      });
    }
  }


  busqueda(busqueda: any): Promise<any[]> {
    this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.BUSQUEDA'));
    this.mostrarTabla = false;
    return new Promise((resolve, reject) => {
      this.oikosMidService.post("gestion_dependencias_mid/BuscarDependencia", busqueda).pipe(
        tap((res: any) => {
          if (res && res.Data) {
            const datosTransformados = res.Data.map((item: any) => ({
              id: item.Dependencia.Id,
              nombre: item.Dependencia.Nombre,
              telefono: item.Dependencia.TelefonoDependencia,
              correo: item.Dependencia.CorreoElectronico,
              dependenciasAsociadas: item.DependenciaAsociada ? {
                id: item.DependenciaAsociada.Id,
                nombre: item.DependenciaAsociada.Nombre
              } : null,
              tipoDependencia: item.TipoDependencia.map((tipo: any) => ({
                id: tipo.Id,
                nombre: tipo.Nombre,
              })),
              estado: item.Estado ? 'ACTIVA' : 'NO ACTIVA',
            }));
            resolve(datosTransformados);
          } else {
            resolve([]);
          }
        }),
        catchError((error) => {
          Swal.close();
          this.popUpManager.showErrorAlert(this.translate.instant('ERROR.BUSQUEDA.BUSQUEDA') + (error.message || this.translate.instant('ERROR.DESCONOCIDO')));
          this.mostrarTabla = false;
          reject(error);
          return of(null);
        })
      ).subscribe();
    });
  }


  procesarResultados(resultados: any[]) {
    if (resultados.length > 0) {
      this.datos = new MatTableDataSource<MapeoBusqueda>(resultados);
      setTimeout(() => { this.datos.paginator = this.paginator; }, 1000);
      this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.BUSQUEDA'));
      this.mostrarTabla = true;
    } else {
      this.popUpManager.showErrorAlert(this.translate.instant('ERROR.BUSQUEDA.DATOS'));
      this.mostrarTabla = false;
    }
  }

}
