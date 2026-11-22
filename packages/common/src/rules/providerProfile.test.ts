import { describe, expect, it } from 'vitest';
import type { Media, Offering } from '../types';
import {
  canChangeProviderStatus,
  canHaveProviderProfile,
  canSubmitProfileForReview,
  getMissingProfileRequirements,
  isProviderPublic,
} from './providerProfile';

const image = { type: 'image' } as Pick<Media, 'type'>;
const video = { type: 'video' } as Pick<Media, 'type'>;
const activeOffering = { isActive: true } as Pick<Offering, 'isActive'>;
const inactiveOffering = { isActive: false } as Pick<Offering, 'isActive'>;

const completeProfile = { status: 'draft' as const, categoryIds: ['cat-caterer'], city: 'Paris' };

describe('règle n° 1 : canHaveProviderProfile', () => {
  it('accepte un utilisateur qui a le rôle prestataire', () => {
    expect(canHaveProviderProfile({ roles: ['client', 'provider'] })).toBe(true);
  });

  it('refuse un simple client', () => {
    expect(canHaveProviderProfile({ roles: ['client'] })).toBe(false);
  });

  it('refuse un admin qui n’est pas prestataire', () => {
    expect(canHaveProviderProfile({ roles: ['client', 'admin'] })).toBe(false);
  });
});

describe('règle n° 2 : profil complet pour la validation', () => {
  it('un profil complet ne manque de rien', () => {
    expect(
      getMissingProfileRequirements(completeProfile, [image, image, image], [activeOffering]),
    ).toEqual([]);
  });

  it('liste tout ce qui manque à un profil vide', () => {
    const missing = getMissingProfileRequirements({ categoryIds: [], city: '  ' }, [], []);
    expect(missing.map((m) => m.requirement)).toEqual(['category', 'images', 'offering', 'city']);
  });

  it('ne compte pas les vidéos comme des photos', () => {
    const missing = getMissingProfileRequirements(
      completeProfile,
      [image, image, video],
      [activeOffering],
    );
    expect(missing).toEqual([
      { requirement: 'images', message: 'Ajoute encore 1 photo (3 minimum)' },
    ]);
  });

  it('accorde le pluriel du nombre de photos manquantes', () => {
    const [missing] = getMissingProfileRequirements(completeProfile, [image], [activeOffering]);
    expect(missing?.message).toBe('Ajoute encore 2 photos (3 minimum)');
  });

  it('ne compte pas les formules désactivées', () => {
    const missing = getMissingProfileRequirements(
      completeProfile,
      [image, image, image],
      [inactiveOffering],
    );
    expect(missing.map((m) => m.requirement)).toEqual(['offering']);
  });

  it('autorise l’envoi d’un brouillon complet', () => {
    expect(
      canSubmitProfileForReview(completeProfile, [image, image, image], [activeOffering]),
    ).toEqual({ allowed: true });
  });

  it('autorise le renvoi après une demande de corrections', () => {
    const result = canSubmitProfileForReview(
      { ...completeProfile, status: 'changes_requested' },
      [image, image, image],
      [activeOffering],
    );
    expect(result.allowed).toBe(true);
  });

  it('refuse un profil incomplet en expliquant pourquoi', () => {
    const result = canSubmitProfileForReview(completeProfile, [image], [activeOffering]);
    expect(result).toEqual({
      allowed: false,
      reason: 'incomplete_profile',
      message: 'Ajoute encore 2 photos (3 minimum)',
    });
  });

  it('refuse un profil déjà publié, même complet', () => {
    const result = canSubmitProfileForReview(
      { ...completeProfile, status: 'published' },
      [image, image, image],
      [activeOffering],
    );
    expect(result).toMatchObject({ allowed: false, reason: 'invalid_status' });
  });
});

describe('cycle de vie du profil', () => {
  it.each([
    ['draft', 'pending_review'],
    ['pending_review', 'published'],
    ['pending_review', 'changes_requested'],
    ['pending_review', 'rejected'],
    ['published', 'paused'],
    ['paused', 'published'],
    ['published', 'suspended'],
    ['suspended', 'published'],
  ] as const)('autorise %s → %s', (from, to) => {
    expect(canChangeProviderStatus(from, to)).toBe(true);
  });

  it.each([
    ['draft', 'published'],
    ['rejected', 'pending_review'],
    ['paused', 'suspended'],
    ['changes_requested', 'published'],
  ] as const)('interdit %s → %s', (from, to) => {
    expect(canChangeProviderStatus(from, to)).toBe(false);
  });

  it('seuls les profils publiés sont visibles', () => {
    expect(isProviderPublic({ status: 'published' })).toBe(true);
    expect(isProviderPublic({ status: 'paused' })).toBe(false);
    expect(isProviderPublic({ status: 'pending_review' })).toBe(false);
  });
});
