export interface ResultadoFirma {
  status: "completed" | "cancelled" | "rejected";
  xmlFirmado?: string;
  hashDocumento?: string;
  serialCertificado?: string;
  rejectionCode?: string;
  motivo?: string;
}

export interface ResultadoValidacion {
  esValida: boolean;
  signerId?: string;
  signerName?: string;
  algorithm?: string;
  certificateStatus?: string;
  signatureDate?: string;
  motivo?: string;
}

export interface CertificadoContribuyente {
  numero_serie: string;
  estado: string;
  [clave: string]: unknown;
}

export interface ContribuyenteEncontrado {
  identificacion: string;
  nombre_razon_social: string;
  tipo_contribuyente: string;
  estadoContribuyente: string;
  firmaVigente: boolean;
  certificado: CertificadoContribuyente | null;
}

export declare const HSM_SIGN_URL: string;
export declare const HSM_API_URL: string;

export declare function firmarConHSMSignCR(datos: {
  identificacion: string;
  xmlFactura: string;
}): Promise<ResultadoFirma>;

export declare function describirResultadoFirma(resultado: ResultadoFirma): string;

export declare function validarConHSMSignCR(xmlFirmado: string): Promise<ResultadoValidacion>;

export declare function consultarCertificadoPorIdentificacion(
  identificacion: string
): Promise<CertificadoContribuyente[]>;

export declare function consultarContribuyentesPorNombre(
  nombre: string
): Promise<ContribuyenteEncontrado[]>;