export function isTrc3File(file: File): boolean {
    return file.name.toLowerCase().endsWith('.trc3');
}

export function isZipFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.zip') || 
           file.type === 'application/zip' || 
           file.type === 'application/x-zip-compressed';
}
