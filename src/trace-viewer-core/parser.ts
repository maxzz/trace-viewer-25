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
    // Lookup array mapping file line index to TimeFlow line index?
    // In C++: m_timelookuparray[uLine] -> index in m_lineptrs.
    // We might just store the linear list of lines sorted by time/occurrence.
    // The C++ TimeFlow seems to contain ALL lines that have timestamps or are relevant to time?
    // Actually C++ PopulateStructures adds most lines to TimeFlow.
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

    constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
        this.crypto = new TraceCrypto();
    }

    public parse(): void {
        let offset = 0;
        
        // 1. Parse Header
        // Header ends with "\n.\r\n" or just ".\r\n" after metadata lines?
        // C++: Writes ".\r\n" as termination dot.
        // It loops reading lines until it finds ".\r\n" (actually checks *pFileMem == '\n' && *(pFileMem+1) == '.').
        
        // Find start of data
        const uint8Array = new Uint8Array(this.buffer);
        let dataStart = 0;
        
        // Scan for "\n.\r\n" pattern to find end of header
        for (let i = 0; i < Math.min(4096, uint8Array.length); i++) { // Header shouldn't be huge
             if (uint8Array[i] === 0x0A && uint8Array[i+1] === 0x2E) {
                 // Found "\n." - usually followed by "\r\n" (0D 0A)
                 dataStart = i + 2; // Skip \n.
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

        // struct SLineHeader { ULONG m_ThreadId; char m_Code; WORD m_StrLength; BYTE m_String[1]; }
        // Size: 4 + 1 + 2 = 7 bytes + content
        
        while (offset < fileSize) {
            if (offset + 7 > fileSize) break;

            const threadId = this.dataView.getUint32(offset, true); // Little endian
            const code = this.dataView.getUint8(offset + 4) as LineCode;
            const length = this.dataView.getUint16(offset + 5, true);
            
            const contentOffset = offset + 7;
            const nextOffset = contentOffset + length;

            if (nextOffset > fileSize) {
                console.warn("Line extends beyond file size", offset);
                break;
            }

            // Read content
            const rawContent = new Uint8Array(this.buffer, contentOffset, length);
            let decryptedContent: Uint8Array = rawContent;

            // Handle Key
            if (code === LineCode.Key) {
                // Add key to crypto stack
                this.crypto.addKey({ 
                    headerOffset: offset,
                    lineFileNumber: lineIndex,
                    lineIndent: 0,
                    threadId,
                    code,
                    strLength: length
                }, rawContent);
            } else {
                // Decrypt if needed
                // C++: g_CryptKeys.Decrypt(m_headerOffset, ...)
                // Note: We pass the offset of the HEADER, not content.
                if (length > 0) {
                    decryptedContent = this.crypto.decrypt(offset, rawContent);
                }
            }

            // Decode string
            let text = "";
            if (length > 0) {
                // Code D (Data) is ANSI, U (Utf8) is UTF8. 
                // Others (Entry, Exit, Error, etc) usually default to ANSI in C++ or UTF8? 
                // C++ TraceLineTextW converts using `utf8(buffer)`. 
                // The `utf8` helper in C++ (Utilities.cpp/h usually) converts FROM utf8 to wide char? 
                // Or is `utf8(...)` a constructor that takes ANSI?
                // `utf8string_t u8 = utf8(v_);` in appendcodeline.
                // `LINECODE::utf8` = 'U'. `LINECODE::data` = 'D'.
                
                // Let's assume 'U' is UTF-8, others are ANSI (Windows-1252).
                if (code === LineCode.Utf8) {
                    text = this.decoderUtf8.decode(decryptedContent);
                } else {
                    text = this.decoderAnsi.decode(decryptedContent);
                }
                
                // Remove null terminator if present? C++ length usually excludes it in structure, 
                // but sometimes includes it in buffer? 
                // SLineHeader: "WORD m_StrLength; //not including last zero"
                // So we shouldn't see nulls, but just in case.
                // text = text.replace(/\0/g, '');
            }

            // Process Flow
            if (!this.threadFlows.has(threadId)) {
                this.threadFlows.set(threadId, new ThreadFlow(threadId));
            }
            const threadFlow = this.threadFlows.get(threadId)!;

            // Indentation Logic
            let indent = threadFlow.indent;
            if (code === LineCode.Entry) {
                threadFlow.indent++;
            } else if (code === LineCode.Exit) {
                if (threadFlow.indent > 0) threadFlow.indent--;
                indent = threadFlow.indent; // Exit lines use the OUTER indent? Or inner?
                // C++: Exit uses indent--.
                // "currentlineptr.SetLineIndent(--nIns);"
            } else {
                // Data, Error etc. use current indent
            }

            const line: TraceLine = {
                lineIndex,
                fileOffset: offset,
                threadId,
                code,
                length,
                content: text,
                indent
            };

            this.lines.push(line);
            
            // Add to flows
            // Note: C++ has complex flow logic (TimeFlow, ThreadFlow).
            // We will keep it simple: All lines go to lines[]. ThreadFlow tracks indents.
            
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
            // ... add others as needed
        });
    }
}

