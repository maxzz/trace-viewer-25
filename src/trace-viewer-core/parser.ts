import { LineCode, type TraceLine, type TraceHeader, type TraceLineDescriptor } from './types';
import { TraceCrypto } from './crypto';

export class ThreadFlow {
    public threadId: number;
    public lines: TraceLineDescriptor[] = [];
    public indent: number = 0;

    constructor(threadId: number) {
        this.threadId = threadId;
    }
}

export class TimeFlow {
    public lines: TraceLineDescriptor[] = [];
}

export class TraceParser {
    private buffer: ArrayBuffer;
    private dataView: DataView;
    private crypto: TraceCrypto;
    private decoderUtf8 = new TextDecoder('utf-8');
    private decoderAnsi = new TextDecoder('windows-1252'); // Approximation of ANSI

    public header: TraceHeader = { magic: '' };
    public lines: TraceLine[] = [];
    public threadFlows: Map<number, ThreadFlow> = new Map();
    public timeFlow: TimeFlow = new TimeFlow();

    private currentTime: string = "";
    private currentDate: string = "";

    constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
        this.crypto = new TraceCrypto();
    }

    public parse(): void {
        let offset = 0;
        
        // 1. Parse Header
        const uint8Array = new Uint8Array(this.buffer);
        let dataStart = 0;
        
        for (let i = 0; i < Math.min(4096, uint8Array.length); i++) {
             if (uint8Array[i] === 0x0A && uint8Array[i+1] === 0x2E) {
                 dataStart = i + 2;
                 if (uint8Array[dataStart] === 0x0D) dataStart++;
                 if (uint8Array[dataStart] === 0x0A) dataStart++;
                 break;
             }
        }
        
        if (dataStart === 0) {
            console.error("Could not find end of header");
            return; 
        }

        const headerText = this.decoderAnsi.decode(uint8Array.slice(0, dataStart));
        this.parseHeaderLines(headerText);

        offset = dataStart;

        // 2. Parse Lines
        let lineIndex = 0;
        const fileSize = this.buffer.byteLength;

        while (offset < fileSize) {
            if (offset + 7 > fileSize) break;

            const threadId = this.dataView.getUint32(offset, true);
            const code = this.dataView.getUint8(offset + 4) as LineCode;
            const length = this.dataView.getUint16(offset + 5, true);
            
            const contentOffset = offset + 7;
            const nextOffset = contentOffset + length;

            if (nextOffset > fileSize) {
                console.warn("Line extends beyond file size", offset);
                break;
            }

            const rawContent = new Uint8Array(this.buffer, contentOffset, length);
            let decryptedContent: Uint8Array = rawContent;

            if (code === LineCode.Key) {
                this.crypto.addKey({ 
                    headerOffset: offset,
                    lineFileNumber: lineIndex,
                    lineIndent: 0,
                    threadId,
                    code,
                    strLength: length
                }, rawContent);
            } else {
                if (length > 0) {
                    decryptedContent = this.crypto.decrypt(offset, rawContent);
                }
            }

            let text = "";
            if (length > 0) {
                if (code === LineCode.Utf8) {
                    text = this.decoderUtf8.decode(decryptedContent);
                } else {
                    text = this.decoderAnsi.decode(decryptedContent);
                }
            }

            // Update Time/Date context
            if (code === LineCode.Time) {
                this.currentTime = text;
                
                // Do NOT add time line to main list (as per user request to move it to a column)
                // We still update offset and lineIndex
                offset = nextOffset;
                lineIndex++;
                continue;
            }
            
            // We can optionally handle Date here too, but keeping it in list for now as separator is often useful.
            if (code === LineCode.Day || code === LineCode.DayRestarted) {
                this.currentDate = text;
            }

            // Process Flow
            if (!this.threadFlows.has(threadId)) {
                this.threadFlows.set(threadId, new ThreadFlow(threadId));
            }
            const threadFlow = this.threadFlows.get(threadId)!;

            let indent = threadFlow.indent;
            if (code === LineCode.Entry) {
                threadFlow.indent++;
            } else if (code === LineCode.Exit) {
                if (threadFlow.indent > 0) threadFlow.indent--;
                indent = threadFlow.indent; 
            }

            const line: TraceLine = {
                lineIndex,
                fileOffset: offset,
                threadId,
                code,
                length,
                content: text,
                indent,
                timestamp: this.currentTime,
                date: this.currentDate
            };

            this.lines.push(line);
            
            offset = nextOffset;
            lineIndex++;
        }
    }

    private parseHeaderLines(headerText: string) {
        const lines = headerText.split(/\r?\n/);
        lines.forEach(line => {
            if (line.startsWith("trace3")) this.header.magic = "trace3";
            else if (line.startsWith("Compiled:")) this.header.compiled = line.substring(10).trim();
            else if (line.startsWith("OS:")) this.header.os = line.substring(4).trim();
            else if (line.startsWith("Machine name:")) this.header.machineName = line.substring(14).trim();
        });
    }
}
