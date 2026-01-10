export type ZipWorkerRequest = {
    type: 'EXTRACT';
    file: File;
};

export type ZipWorkerResponse =
    | { type: 'SUCCESS'; files: ExtractedFile[]; }
    | { type: 'ERROR'; error: string; };

export type ExtractedFile = {
    name: string;
    buffer: ArrayBuffer;
};
