import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';
import { MediaScope } from './dto/presign-media.dto';

interface PresignParams {
  contentType: string;
  scope: MediaScope;
  userId?: string;
  draftId?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucket: string;
  private readonly publicBase?: string;
  private readonly presignTtlSeconds: number;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly endpoint: string;
  private readonly region: string;
  private readonly endpointUrl: URL;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('r2.bucket') ?? '';
    this.publicBase = this.configService.get<string>('r2.publicBase') ?? '';
    this.presignTtlSeconds =
      this.configService.get<number>('r2.presignTtlSeconds') ?? 300;
    this.accessKeyId = this.configService.get<string>('r2.accessKeyId') ?? '';
    this.secretAccessKey =
      this.configService.get<string>('r2.secretAccessKey') ?? '';
    this.endpoint = (this.configService.get<string>('r2.endpoint') ?? '').replace(
      /\/$/,
      '',
    );
    this.region = this.configService.get<string>('r2.region') ?? 'auto';

    try {
      this.endpointUrl = new URL(this.endpoint);
    } catch (error) {
      this.logger.error('Endpoint R2 invalide', error);
      throw new ServiceUnavailableException('Endpoint R2 invalide');
    }
  }

  async createPresignedPutUrl(params: PresignParams): Promise<{
    url: string;
    key: string;
    publicUrl?: string;
    expiresIn: number;
  }> {
    this.ensureConfiguration();
    const key = this.buildObjectKey(params);

    try {
      const url = this.buildPresignedUrl({
        method: 'PUT',
        bucket: this.bucket,
        key,
        expiresIn: this.presignTtlSeconds,
      });

      return {
        url,
        key,
        publicUrl: this.buildPublicUrl(key),
        expiresIn: this.presignTtlSeconds,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la génération du lien presigné', error);
      throw new ServiceUnavailableException(
        'Impossible de générer un lien presigné pour le moment',
      );
    }
  }

  private ensureConfiguration(): void {
    if (
      !this.bucket ||
      !this.accessKeyId ||
      !this.secretAccessKey ||
      !this.endpoint
    ) {
      throw new ServiceUnavailableException('Configuration R2 incomplète');
    }
  }

  private buildObjectKey(params: PresignParams): string {
    const extension = this.contentTypeToExtension(params.contentType);
    const filename = `${randomUUID()}.${extension}`;

    if (params.userId) {
      return `users/${params.userId}/${filename}`;
    }

    if (params.draftId) {
      return `drafts/${params.draftId}/${filename}`;
    }

    this.logger.warn(
      'Génération de clé presignée sans userId ni draftId (fallback anonymous)',
    );
    return `anonymous/${filename}`;
  }

  private buildPresignedUrl(params: {
    method: string;
    bucket: string;
    key: string;
    expiresIn: number;
  }): string {
    const now = new Date();
    const amzDate = this.getAmzDate(now);
    const dateStamp = this.getDateStamp(now);
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const canonicalUri = `/${params.bucket}/${this.encodeUriPath(params.key)}`;
    const queryParams = new Map<string, string>([
      ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
      ['X-Amz-Credential', `${this.accessKeyId}/${credentialScope}`],
      ['X-Amz-Date', amzDate],
      ['X-Amz-Expires', params.expiresIn.toString()],
      ['X-Amz-SignedHeaders', 'host'],
    ]);

    const canonicalQueryString = Array.from(queryParams.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(
        ([key, value]) =>
          `${this.encodeRfc3986(key)}=${this.encodeRfc3986(value)}`,
      )
      .join('&');

    const host = this.endpointUrl.host;
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      params.method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const hashedCanonicalRequest = this.sha256(canonicalRequest);
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      hashedCanonicalRequest,
    ].join('\n');

    const signature = this.buildSignature(stringToSign, dateStamp);

    const presignedUrl = `${this.endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
    return presignedUrl;
  }

  private contentTypeToExtension(contentType: string): string {
    switch (contentType) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/heic':
        return 'heic';
      default:
        return contentType.split('/')[1] ?? 'bin';
    }
  }

  private buildPublicUrl(key: string): string | undefined {
    if (!this.publicBase) {
      return undefined;
    }

    return `${this.publicBase.replace(/\/$/, '')}/${key}`;
  }

  private getAmzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  }

  private getDateStamp(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private buildSignature(stringToSign: string, dateStamp: string): string {
    const kDate = this.hmac(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = this.hmac(kDate, this.region);
    const kService = this.hmac(kRegion, 's3');
    const kSigning = this.hmac(kService, 'aws4_request');
    return this.hmacHex(kSigning, stringToSign);
  }

  private hmac(key: string | Buffer, data: string): Buffer {
    return createHmac('sha256', key).update(data, 'utf8').digest();
  }

  private hmacHex(key: Buffer, data: string): string {
    return createHmac('sha256', key).update(data, 'utf8').digest('hex');
  }

  private encodeUriPath(key: string): string {
    return key
      .split('/')
      .map((segment) => this.encodeRfc3986(segment))
      .join('/');
  }

  private encodeRfc3986(value: string): string {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }
}
