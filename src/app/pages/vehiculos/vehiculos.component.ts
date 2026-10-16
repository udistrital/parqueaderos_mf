import { AfterViewInit, Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { VehiculoBusqueda } from '../../models/vehiculo-busqueda.models'
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { EditarVehiculoDialogComponent } from './components/editar-vehiculo-dialog/editar-vehiculo-dialog.component'
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Desplegables } from 'src/app/models/desplegables.models';
import { TercerosService } from '../../services/terceros.service';
import { PopUpManager } from '../../managers/popUpManager'

// @ts-ignore
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-vehiculos',
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.css']
})
export class VehiculosComponent implements OnInit, AfterViewInit {
  @Input('normalform') normalform: any;
  @ViewChild(MatPaginator) paginator !: MatPaginator;

  tiposDependencia: Desplegables[] = [];
  facultades: Desplegables[] = [];
  vicerrectorias: Desplegables[] = [];
  mostrarTabla: boolean = false;
  cargando: boolean = false; // <-- Variable para el loader
  columnasBusqueda = signal<string[]>(["PLACA", "PERSONA", "TIPOVEHICULO", "SEDES", "ESTADO", "ACCIONES"]);
  gestionForm !: FormGroup;
  filtroForm !: FormGroup;
  elementosBusqueda = signal<VehiculoBusqueda[]>([]);
  datos = new MatTableDataSource<VehiculoBusqueda>();
  vehiculo: any = {};
  vehiculos: any[] = [];

  constructor(
    private tercerosService: TercerosService,
    public dialog: MatDialog,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
  ) {
    translate.setDefaultLang('es');


  }

  ngOnInit() {
    this.iniciarFormularioConsulta();

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
    this.filtroForm = new FormGroup({
      filtro: new FormControl()
    });
  }





  abrirDialogGenerarEditarMapeo(tipo: string, element: VehiculoBusqueda) {

    const dialogRef = this.dialog.open(EditarVehiculoDialogComponent, {
      width: '70%',
      height: 'auto',
      maxHeight: '65vh',
      data: {
        tipo: tipo,
        element: element,
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
     
        this.buscarVehiculos();
      
    });
  }

  construirBusqueda() {
    const busqueda: any = {};
    busqueda.BusquedaEstado = false;
    if (this.gestionForm.value.estado) {
      if (this.gestionForm.value.estado === 'ACTIVO') {
        busqueda.BusquedaEstado = true;
      }
      else
        busqueda.BusquedaEstado = false;
    }
    console.log('Busqueda construida:', busqueda);
    return busqueda;
  }

  buscarVehiculos() {
    const busqueda = this.construirBusqueda();


    this.busqueda(busqueda).then((resultadosParciales) => {
      this.procesarResultados(resultadosParciales);
    });

  }


  busqueda(busqueda: any): Promise<any[]> {
    this.popUpManager.showLoaderAlert(this.translate.instant('CARGA.BUSQUEDA'));
    this.mostrarTabla = false;
    this.vehiculos = [];
    return new Promise((resolve, reject) => {
      this.tercerosService.get('info_complementaria_tercero/?query=InfoComplementariaId.GrupoInfoComplementariaId.CodigoAbreviacion:PARQUEADERO,Activo:' + busqueda.BusquedaEstado+'&limit=-1').subscribe((datosParqueadero: any) => {
        if (datosParqueadero) {
          for (let i = 0; i < datosParqueadero.length; i++) {
            this.vehiculo = {};
            this.vehiculo.id = datosParqueadero[i].Id;
            this.vehiculo.terceroId = datosParqueadero[i].TerceroId.Id;
            this.vehiculo.persona = datosParqueadero[i].TerceroId.NombreCompleto;
            this.vehiculo.tipoVehiculo = (JSON.parse(datosParqueadero[i].Dato)).tipoVehiculo;
            this.vehiculo.placa = (JSON.parse(datosParqueadero[i].Dato)).placa;
            this.vehiculo.sedes = (JSON.parse(datosParqueadero[i].Dato)).sedes;
            this.vehiculo.documento = (JSON.parse(datosParqueadero[i].Dato)).enlaceDocumento;
            this.vehiculo.soportes = (JSON.parse(datosParqueadero[i].Dato)).enlaceSoporte;
            this.vehiculo.estado = datosParqueadero[i].Activo ? "ACTIVO" : "NO ACTIVO";
            console.log('estado:', datosParqueadero[i].Activo);
            console.log('estado traducido:', this.vehiculo.estado);
            this.vehiculos.push(this.vehiculo);
          }

          resolve(this.vehiculos);
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
    });

  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.datos.filter = filterValue.trim().toLowerCase();
  }

  procesarResultados(resultados: any[]) {
    console.log('Resultados de la búsqueda:', resultados);
    if (resultados.length > 0) {
      this.datos = new MatTableDataSource<VehiculoBusqueda>(resultados);
      setTimeout(() => { this.datos.paginator = this.paginator; }, 1000);
      this.popUpManager.showSuccessAlert(this.translate.instant('EXITO.BUSQUEDA'));
      this.mostrarTabla = true;
    } else {
      this.popUpManager.showErrorAlert(this.translate.instant('ERROR.BUSQUEDA.DATOS'));
      this.mostrarTabla = false;
    }
  }

}
