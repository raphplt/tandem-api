import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingDraft } from './entities/onboarding-draft.entity';
import { UpsertOnboardingDraftDto } from './dto/upsert-onboarding-draft.dto';
import * as crypto from 'crypto';

const DRAFT_TTL_HOURS = 72;

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingDraft)
    private readonly onboardingDraftRepository: Repository<OnboardingDraft>,
  ) {}

  async upsertDraft(
    dto: UpsertOnboardingDraftDto,
  ): Promise<{ draft: OnboardingDraft; draftToken: string }> {
    const now = new Date();
    const expiresAt = this.computeNextExpiry(now);
    const payloadPatch = dto.payload ?? {};

    let existingDraft = await this.onboardingDraftRepository.findOne({
      where: { deviceId: dto.deviceId },
    });

    if (existingDraft && this.isExpired(existingDraft, now)) {
      await this.onboardingDraftRepository.remove(existingDraft);
      existingDraft = null;
    }

    if (!existingDraft) {
      const { token, tokenHash } = this.generateTokenPair();
      const draft = this.onboardingDraftRepository.create({
        deviceId: dto.deviceId,
        payloadJson: payloadPatch,
        tokenHash,
        expiresAt,
      });

      const saved = await this.onboardingDraftRepository.save(draft);
      return { draft: saved, draftToken: token };
    }

    if (!dto.draftToken || !this.isTokenValid(existingDraft, dto.draftToken)) {
      throw new UnauthorizedException('Draft token invalide ou manquant');
    }

    const mergedPayload = this.mergePayload(
      (existingDraft.payloadJson ?? {}) as Record<string, unknown>,
      payloadPatch,
    );
    existingDraft.payloadJson = mergedPayload;
    existingDraft.expiresAt = expiresAt;

    const saved = await this.onboardingDraftRepository.save(existingDraft);
    return { draft: saved, draftToken: dto.draftToken };
  }

  async getDraft(
    deviceId: string,
    draftToken: string,
  ): Promise<OnboardingDraft> {
    const now = new Date();
    const draft = await this.onboardingDraftRepository.findOne({
      where: { deviceId },
    });

    if (!draft) {
      throw new NotFoundException('Draft introuvable pour ce device');
    }

    if (this.isExpired(draft, now)) {
      await this.onboardingDraftRepository.remove(draft);
      throw new NotFoundException('Draft expiré');
    }

    if (!this.isTokenValid(draft, draftToken)) {
      throw new UnauthorizedException('Draft token invalide');
    }

    return draft;
  }

  async assertDraftById(
    draftId: string,
    draftToken: string,
  ): Promise<OnboardingDraft> {
    const now = new Date();
    const draft = await this.onboardingDraftRepository.findOne({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('Draft introuvable');
    }

    if (this.isExpired(draft, now)) {
      await this.onboardingDraftRepository.remove(draft);
      throw new NotFoundException('Draft expiré');
    }

    if (!this.isTokenValid(draft, draftToken)) {
      throw new UnauthorizedException('Draft token invalide');
    }

    return draft;
  }

  private computeNextExpiry(reference: Date): Date {
    return new Date(
      reference.getTime() + DRAFT_TTL_HOURS * 60 * 60 * 1000,
    );
  }

  private isExpired(draft: OnboardingDraft, reference: Date): boolean {
    return draft.expiresAt.getTime() <= reference.getTime();
  }

  private generateTokenPair(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    return { token, tokenHash: this.hashToken(token) };
  }

  private isTokenValid(draft: OnboardingDraft, token: string): boolean {
    if (!draft.tokenHash) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(draft.tokenHash, 'hex'),
      Buffer.from(this.hashToken(token), 'hex'),
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private mergePayload(
    current: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown> {
    const output = { ...current };

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        continue;
      }

      if (value === null) {
        delete output[key];
        continue;
      }

      const existing = output[key];
      if (this.isPlainObject(existing) && this.isPlainObject(value)) {
        output[key] = this.mergePayload(
          existing as Record<string, unknown>,
          value as Record<string, unknown>,
        );
        continue;
      }

      output[key] = value;
    }

    return output;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === '[object Object]'
    );
  }
}
