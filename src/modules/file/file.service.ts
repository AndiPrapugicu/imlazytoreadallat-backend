import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { join, extname } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class FileService {
  handleFileUpload(file: Express.Multer.File) {
    const uploadPath = join(__dirname, '../../../uploads', file.originalname);

    // Salvează fișierul pe disc
    writeFileSync(uploadPath, file.buffer);

    return {
      message: 'Fișier încărcat cu succes!',
      filename: file.originalname,
      path: uploadPath,
    };
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      const fileExtension = extname(filePath).toLowerCase();

      if (fileExtension === '.txt') {
        // Citește fișiere text brute
        return readFileSync(filePath, 'utf-8');
      } else if (fileExtension === '.pdf') {
        // Citește fișiere PDF
        const pdfBuffer = readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;
      } else if (fileExtension === '.docx') {
        // Citește fișiere DOCX
        const docxBuffer = readFileSync(filePath);
        const docxData = await mammoth.extractRawText({ buffer: docxBuffer });
        return docxData.value;
      } else {
        throw new Error('Tipul fișierului nu este suportat.');
      }
    } catch (error) {
      console.error('Eroare la citirea fișierului:', error);
      throw new Error('Nu s-a putut citi fișierul.');
    }
  }

  async generateSummary(file: Express.Multer.File): Promise<string> {
    const content = await this.readFileContent(
      join(__dirname, '../../../uploads', file.originalname),
    );

    try {
      const response = await axios.post(
        'https://llama-server-b82l.onrender.com//summarize',
        {
          text: content,
        },
      );

      return response.data.summary || 'Nu s-a putut genera rezumatul.';
    } catch (error) {
      console.error('Eroare server Llama:', error);
      return 'Eroare la generarea rezumatului.';
    }
  }
}
