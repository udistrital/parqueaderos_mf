import { Desplegables } from "./desplegables.models";

export interface MapeoBusqueda {
    id: number;
    nombre: string;
    dependenciasAsociadas: Desplegables;
    tipoDependencia: Desplegables[];
    tipo: string;
    idArgo: number;
    numIdInterno: number;
    codSnies: number;
    codIris: number; 
}