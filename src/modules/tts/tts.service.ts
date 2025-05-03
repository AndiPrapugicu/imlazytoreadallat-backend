import { Injectable } from '@nestjs/common';
import { join } from 'path';
import {
  writeFileSync,
  existsSync,
  unlinkSync,
  readdirSync,
  mkdirSync,
} from 'fs';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid'; // Instalează uuid: npm install uuid
import * as ffmpeg from 'fluent-ffmpeg';
const gTTS = require('gtts');

@Injectable()
export class TtsService {
  async generateAudio(
    text: string,
    backgroundType: 'lofi' | 'rap',
    language: string, // Adăugat: Parametru pentru limba selectată
  ) {
    console.log('Text pentru TTS:', text);
    console.log('Limba selectată:', language); // Log pentru limba selectată

    const audioFilename = `${uuidv4()}.mp3`; // Nume unic pentru fiecare fișier
    const audioPath = join(__dirname, '../../../uploads', audioFilename);

    const backgroundFolder =
      backgroundType === 'lofi'
        ? join(__dirname, '../../../assets/lofi') // Folder Lo-fi
        : join(__dirname, '../../../assets/rap'); // Folder Rap

    const outputFilename = `${uuidv4()}_mixed.mp3`;
    const outputPath = join(__dirname, '../../../uploads', outputFilename);

    try {
      // Șterge fișierul existent dacă există
      if (existsSync(audioPath)) {
        unlinkSync(audioPath);
      }

      const gtts = new gTTS(text, language); // Modificat: Setează limba selectată

      // Generează audio-ul text-to-speech
      await new Promise<void>((resolve, reject) => {
        gtts.save(audioPath, (err) => {
          if (err) {
            console.error('Eroare la generarea audio:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Obține durata audio-ului generat
      const audioDuration = await this.getAudioDuration(audioPath);

      console.log('Generare audio cu fundal din folderul:', backgroundFolder);

      // Obține toate fișierele din folderul de fundal
      const files = readdirSync(backgroundFolder).filter((file) =>
        file.endsWith('.mp3'),
      );

      if (files.length === 0) {
        throw new Error('Nu există piese în folderul selectat.');
      }

      // Creează comanda ffmpeg pentru concatenare și mixare
      const ffmpegCommand = ffmpeg().input(audioPath);

      let totalDuration = 0;
      let index = 0;

      // Adaugă piesele în buclă până când durata totală este acoperită
      while (totalDuration < audioDuration) {
        const track = join(backgroundFolder, files[index % files.length]);
        console.log(`Adăugare piesă: ${track}`);
        ffmpegCommand.input(track);
        totalDuration += await this.getAudioDuration(track);
        index++;
      }

      // Aplică filtrele pentru mixare
      ffmpegCommand
        .complexFilter([
          '[1]volume=0.1,afade=t=in:st=0:d=2.5[bg]', // Muzica de fundal cu fade-in și volum redus
          '[0][bg]amix=inputs=2:duration=first:dropout_transition=2', // Mixare audio
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('Comanda FFmpeg:', commandLine);
        })
        .on('end', () => {
          console.log('Mixare audio finalizată.');
        })
        .on('error', (err) => {
          console.error('Eroare la mixarea audio:', err);
          throw new Error('Eroare la mixarea audio.');
        });

      // Rulează comanda ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpegCommand.on('end', resolve).on('error', reject).run();
      });

      return {
        message: 'Audio generat cu succes!',
        audioUrl: `http://localhost:3000/uploads/${outputFilename}`,
      };
    } catch (error) {
      console.error('Eroare la generarea audio:', error);
      throw new Error('Nu s-a putut genera fișierul audio.');
    }
  }

  // Creează un playlist din piesele dintr-un folder
  private async createPlaylist(
    folderPath: string,
    duration: number,
  ): Promise<string> {
    const files = readdirSync(folderPath).filter((file) =>
      file.endsWith('.mp3'),
    );

    if (files.length === 0) {
      console.error(`Nu există fișiere în folderul: ${folderPath}`);
      throw new Error('Nu există piese în folderul selectat.');
    }

    console.log('Fișiere detectate:', files);

    const playlistPath = join(__dirname, '../../../uploads/playlist.txt');
    if (!existsSync(join(__dirname, '../../../uploads'))) {
      mkdirSync(join(__dirname, '../../../uploads'), { recursive: true });
      console.log('Folderul uploads a fost creat.');
    }

    const playlistContent: string[] = []; // Specificăm explicit tipul ca string[]

    let totalDuration = 0;
    let index = 0;

    while (totalDuration < duration) {
      const track = files[index % files.length]; // Reia piesele dacă se termină
      playlistContent.push(
        `file '${join(folderPath, track).replace(/\\/g, '/')}'`,
      );
      totalDuration += this.getAudioDurationSync(join(folderPath, track));
      index++;
    }

    await writeFile(playlistPath, playlistContent.join('\n'));
    console.log('Fișierul playlist.txt a fost creat la:', playlistPath);
    console.log('Conținutul playlist-ului:', playlistContent.join('\n'));
    return playlistPath;
  }

  // Helper pentru a obține durata unui fișier audio
  private getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }

  // Helper sincron pentru a obține durata unui fișier audio
  private getAudioDurationSync(filePath: string): number {
    let duration = 0;
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (!err) {
        duration = metadata.format.duration;
      }
    });
    return duration;
  }
}
