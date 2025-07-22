export interface CSVRow {
  [key: string]: string;
}

export class CSVParser {
  static parse(csvContent: string): CSVRow[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = this.parseCSVLine(lines[0]);
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }

    return rows;
  }

  static stringify(data: CSVRow[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const headerLine = headers.map(h => this.escapeCSVField(h)).join(',');
    
    const dataLines = data.map(row => 
      headers.map(header => this.escapeCSVField(row[header] || '')).join(',')
    );

    return [headerLine, ...dataLines].join('\n');
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current);
    return result;
  }

  private static escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}