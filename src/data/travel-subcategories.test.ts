import { describe, expect, it } from 'vitest';
import { placePinMaterialName } from './travel-categories';
import {
  pinMaterialFromSubcategories,
  subcategoryMaterialIcon,
} from './travel-subcategories';

describe('subcategory pin icons', () => {
  it('maps cafés types to distinct Material glyphs', () => {
    expect(subcategoryMaterialIcon['coffee-shop']).toBe('local_cafe');
    expect(subcategoryMaterialIcon.pastry).toBe('cookie');
    expect(subcategoryMaterialIcon.bakery).toBe('bakery_dining');
    expect(subcategoryMaterialIcon['ice-cream']).toBe('icecream');
  });

  it('maps commons chain types to burger Material glyph', () => {
    expect(subcategoryMaterialIcon.burgers).toBe('lunch_dining');
    // KFC (chicken sub) shares the burger glyph
    expect(subcategoryMaterialIcon.chicken).toBe('lunch_dining');
  });

  it('maps parks & walks types to distinct Material glyphs', () => {
    expect(subcategoryMaterialIcon.park).toBe('nature');
    expect(subcategoryMaterialIcon.garden).toBe('yard');
    expect(subcategoryMaterialIcon.neighborhood).toBe('holiday_village');
    expect(subcategoryMaterialIcon.avenue).toBe('directions_walk');
    expect(subcategoryMaterialIcon['market-street']).toBe('nature');
    expect(subcategoryMaterialIcon.architecture).toBe('nature');
    expect(subcategoryMaterialIcon.square).toBe('nature');
    expect(subcategoryMaterialIcon.library).toBe('import_contacts');
  });

  it('prefers distinctive café type over coffee-shop', () => {
    expect(pinMaterialFromSubcategories(['bakery', 'coffee-shop'])).toBe(
      'bakery_dining',
    );
    // Dual bakery+pastry → bakery (e.g. La Maison d'Isabelle)
    expect(pinMaterialFromSubcategories(['pastry', 'bakery'])).toBe(
      'bakery_dining',
    );
    expect(pinMaterialFromSubcategories(['pastry'])).toBe('cookie');
    expect(pinMaterialFromSubcategories(['ice-cream'])).toBe('icecream');
  });

  it('prefers landmark-ish park subs over generic park', () => {
    expect(pinMaterialFromSubcategories(['library', 'architecture'])).toBe(
      'import_contacts',
    );
    expect(pinMaterialFromSubcategories(['park', 'garden'])).toBe('nature');
    expect(pinMaterialFromSubcategories(['garden'])).toBe('yard');
    expect(pinMaterialFromSubcategories(['neighborhood', 'architecture'])).toBe(
      'nature',
    );
  });

  it('placePinMaterialName uses sub for parks, cafes, and commons', () => {
    expect(placePinMaterialName('cafes', ['pastry'])).toBe('cookie');
    expect(placePinMaterialName('cafes', ['bakery'])).toBe('bakery_dining');
    expect(placePinMaterialName('parks', ['park'])).toBe('nature');
    expect(placePinMaterialName('parks', ['avenue'])).toBe('directions_walk');
    expect(placePinMaterialName('parks', ['neighborhood'])).toBe(
      'holiday_village',
    );
    expect(placePinMaterialName('commons', ['burgers'])).toBe('lunch_dining');
    expect(placePinMaterialName('commons', ['chicken'])).toBe('lunch_dining');
    expect(placePinMaterialName('commons', ['coffee-shop'])).toBe('local_cafe');
    expect(placePinMaterialName('cafes', [])).toBe('local_cafe');
    expect(placePinMaterialName('parks', undefined)).toBe('nature');
    expect(placePinMaterialName('commons', undefined)).toBe('lunch_dining');
    // Other categories stay on category glyph even with subs
    expect(placePinMaterialName('restaurants', ['italian'])).toBe('restaurant');
    expect(placePinMaterialName('tourist', ['monument'])).toBe('star');
  });
});
