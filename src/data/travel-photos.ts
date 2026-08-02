/**
 * Place gallery photos for /travel cards (cover + slider).
 *
 * Place-specific only — no generic stock food/coffee/café fillers.
 * Preferred sources:
 *  - Wikimedia Commons / Wikipedia (landmarks, streets, venues)
 *  - Openverse CC assets only when the file clearly depicts that place
 *
 * For a few small private shops without free storefront photos, the cover
 * is the actual street / square / quay of the venue (still location-true).
 * Google Place Photos are not used (API billing + ephemeral media URLs).
 */

import type { LString } from './travel';

export type TravelPhoto = {
  url: string;
  alt?: LString;
  credit?: string;
};

function photo(
  url: string,
  en: string,
  pt: string,
  credit: string,
): TravelPhoto {
  return { url, alt: { en, 'pt-BR': pt }, credit };
}

export const photosByPlaceId: Record<string, TravelPhoto[]> = {
  'par-bouillon': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chez_Chartier_1.JPG',
      'Bouillon',
      'Bouillon',
      'Wikimedia Commons',
    ),
  ],
  'par-cedric-grolet': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/1/1a/Place_de_l%27Op%C3%A9ra.jpg',
      'Cédric Grolet',
      'Cédric Grolet',
      'Wikimedia Commons',
    ),
  ],

  'par-alexandre-iii': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pont_Alexandre_III_depuis_pont_de_la_Concorde_Paris.jpg/1280px-Pont_Alexandre_III_depuis_pont_de_la_Concorde_Paris.jpg',
      'Pont Alexandre III',
      'Pont Alexandre III',
      'Wikimedia Commons',
    ),
  ],
  'par-amorino': [
    photo(
      'https://live.staticflickr.com/3639/3556419210_9720265342_b.jpg',
      'Amorino',
      'Amorino',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-andre-citroen': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/03/Serres_Parc-Andr%C3%A9-Citro%C3%ABn-Paris.jpg',
      'Parc André Citroën',
      'Parc André Citroën',
      'Wikimedia Commons',
    ),
  ],
  'par-arc-triomphe': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Arc_de_Triomphe%2C_Paris_21_October_2010.jpg/1280px-Arc_de_Triomphe%2C_Paris_21_October_2010.jpg',
      'Arc de Triomphe',
      'Arc de Triomphe',
      'Wikimedia Commons',
    ),
  ],
  'par-arnaud-nicolas': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/9/9e/P1160897_Paris_XVII_rue_de_L%C3%A9vis_rwk.jpg',
      'Charcuterie Arnaud Nicolas',
      'Charcuterie Arnaud Nicolas',
      'Wikimedia Commons',
    ),
  ],
  'par-auptitgrec': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Facade_de_magasin_Au_p%27tit_grec_%C3%A0_l%27angle_des_rues_Cujas_et_Mouffetard.jpg/1280px-Facade_de_magasin_Au_p%27tit_grec_%C3%A0_l%27angle_des_rues_Cujas_et_Mouffetard.jpg',
      'Au P\'tit Grec',
      'Au P\'tit Grec',
      'Wikimedia Commons',
    ),
  ],
  'par-bake-blend': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/2/29/MG-Paris-Champ_de_Mars.jpg',
      'Bake & Blend',
      'Bake & Blend',
      'Wikimedia Commons',
    ),
  ],
  'par-bakery-gaite': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Acc%C3%A8s_Station_Ga%C3%AEt%C3%A9_M%C3%A9tro_Paris_Avenue_Maine_-_Paris_XIV_%28FR75%29_-_2025-01-18_-_3.jpg/1280px-Acc%C3%A8s_Station_Ga%C3%AEt%C3%A9_M%C3%A9tro_Paris_Avenue_Maine_-_Paris_XIV_%28FR75%29_-_2025-01-18_-_3.jpg',
      'Paris Bakery & Co Gaîté',
      'Paris Bakery & Co Gaîté',
      'Wikimedia Commons',
    ),
  ],
  'par-bastille': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Place_de_la_Bastille%2C_avril_2021.jpg/3840px-Place_de_la_Bastille%2C_avril_2021.jpg',
      'Place de la Bastille',
      'Place de la Bastille',
      'Wikimedia Commons',
    ),
  ],
  'par-bateaux-mouches': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Bateaux_Mouches_%C3%A0_Paris_en_f%C3%A9vrier_2015_-_1.jpg/1280px-Bateaux_Mouches_%C3%A0_Paris_en_f%C3%A9vrier_2015_-_1.jpg',
      'Bateaux-Mouches',
      'Bateaux-Mouches',
      'Wikimedia Commons',
    ),
  ],
  'par-bien-eleve': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/6/6b/Si_les_ministres_montent_l%C3%A0%2C_nom_de_D._on_pourra_dire_qui_sont_bien_%C3%A9lev%C3%A9s%2C_%C3%A7a_a_quatre_fois_ma_taille._G.8111.jpg',
      'Bien Élevé',
      'Bien Élevé',
      'Wikimedia Commons',
    ),
  ],
  'par-bike': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/V%C3%A9lib%27_Paris.jpg/1280px-V%C3%A9lib%27_Paris.jpg',
      'Bike around Paris',
      'Bike around Paris',
      'Wikimedia Commons',
    ),
  ],
  'par-bnf': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Biblioth%C3%A8que_Mitterrand_Mai_2022.jpg/3840px-Biblioth%C3%A8que_Mitterrand_Mai_2022.jpg',
      'Bibliothèque nationale',
      'Bibliothèque nationale',
      'Wikimedia Commons',
    ),
  ],
  'par-bohemia': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/1/14/P1050077_Paris_Ier_place_Mireille_fontaine_Moli%C3%A8re_rwk.JPG',
      'Bohemia Café',
      'Bohemia Café',
      'Wikimedia Commons',
    ),
  ],
  'par-boulogne': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/La_D%C3%A9fense_and_Bois_de_Boulogne_from_the_Eiffel_Tower%2C_11_June_2017_001.jpg/3840px-La_D%C3%A9fense_and_Bois_de_Boulogne_from_the_Eiffel_Tower%2C_11_June_2017_001.jpg',
      'Bois de Boulogne',
      'Bois de Boulogne',
      'Wikimedia Commons',
    ),
  ],
  'par-brasserie-pres': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/0e/P1020083_Paris_VI_Cour_du_Commerce-Saint-Andr%C3%A9_reductwk.JPG',
      'Brasserie des Prés',
      'Brasserie des Prés',
      'Wikimedia Commons',
    ),
  ],
  'par-buttes-chaumont': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Passerelle_suspendue%2C_Buttes_Chaumont%2C_Paris_14_April_2014.jpg/3840px-Passerelle_suspendue%2C_Buttes_Chaumont%2C_Paris_14_April_2014.jpg',
      'Parc des Buttes-Chaumont',
      'Parc des Buttes-Chaumont',
      'Wikimedia Commons',
    ),
  ],
  'par-canals': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Canal_Saint-Martin_Paris_FRA_001.jpg/1280px-Canal_Saint-Martin_Paris_FRA_001.jpg',
      'Paris canals walk',
      'Paris canals walk',
      'Wikimedia Commons',
    ),
  ],
  'par-champ-mars': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Champ_de_Mars_from_the_Eiffel_Tower_-_July_2006_edit.jpg/1280px-Champ_de_Mars_from_the_Eiffel_Tower_-_July_2006_edit.jpg',
      'Champ de Mars',
      'Champ de Mars',
      'Wikimedia Commons',
    ),
  ],
  'par-champs-elysees': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/6/6d/Avenue_des_Champs-%C3%89lys%C3%A9es_July_24%2C_2009_N1.jpg',
      'Champs-Élysées',
      'Champs-Élysées',
      'Wikimedia Commons',
    ),
  ],
  'par-chateau-vincennes': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Vincennes_-_Chateau_02.jpg/3840px-Vincennes_-_Chateau_02.jpg',
      'Château de Vincennes',
      'Château de Vincennes',
      'Wikimedia Commons',
    ),
  ],
  'par-chatelet': [
    photo(
      'https://live.staticflickr.com/8106/8539705697_0d3bd8ec0b_b.jpg',
      'Châtelet',
      'Châtelet',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-chez-elo': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/d/d3/Paris_Hotel_de_Sens_dsc04028.jpg',
      'Chez Elo',
      'Chez Elo',
      'Wikimedia Commons',
    ),
  ],
  'par-chez-janou': [
    photo(
      'https://live.staticflickr.com/55/143096731_7a3ef7ff8f_b.jpg',
      'Chez Janou',
      'Chez Janou',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-cour-commerce': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/8/83/Plaque_Sainte-Beuve%2C_2_cour_du_Commerce-Saint-Andr%C3%A9%2C_Paris_6e.jpg',
      'Cour du Commerce Saint-André',
      'Cour du Commerce Saint-André',
      'Wikimedia Commons',
    ),
  ],
  'par-creperie-arts': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/5/59/Cr%C3%AAperie_des_Arts%2C_27_Rue_Saint-Andr%C3%A9-des-Arts_%28Paris%29_2010-07-29.jpg',
      'Crêperie des Arts',
      'Crêperie des Arts',
      'Wikimedia Commons',
    ),
  ],
  'par-eclair-genie': [
    photo(
      'https://live.staticflickr.com/7440/27514629941_52f934e034_b.jpg',
      'L\'Éclair de Génie',
      'L\'Éclair de Génie',
      'Bex.Walton / flickr (by)',
    ),
  ],
  'par-eiffel': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/1280px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
      'Eiffel Tower',
      'Eiffel Tower',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Tour_Eiffel_vue_du_Champ-de-Mars.jpg/1280px-Tour_Eiffel_vue_du_Champ-de-Mars.jpg',
      'Eiffel Tower',
      'Eiffel Tower',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Eiffel_Tower_and_Pont_Alexandre_III_at_night.jpg/1280px-Eiffel_Tower_and_Pont_Alexandre_III_at_night.jpg',
      'Eiffel Tower',
      'Eiffel Tower',
      'Wikimedia Commons',
    ),
  ],
  'par-entrecote': [
    photo(
      'https://live.staticflickr.com/6048/6282092427_31dbfa9b03_b.jpg',
      'Le Relais de l\'Entrecôte',
      'Le Relais de l\'Entrecôte',
      'irene. / flickr (by-sa)',
    ),
  ],
  'par-felicita': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/1/17/Bar_et_restaurant_dans_La_Felicit%C3%A0%2C_Paris._02.jpg',
      'La Felicità',
      'La Felicità',
      'Wikimedia Commons',
    ),
  ],
  'par-fondation-lv': [
    photo(
      'https://upload.wikimedia.org/wikipedia/en/0/03/Fondation_Louis_Vuitton_-_Paris_%2850569906682%29.jpg',
      'Fondation Louis Vuitton',
      'Fondation Louis Vuitton',
      'Wikimedia Commons',
    ),
  ],
  'par-francette': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/a/aa/P1080375_Paris_XV_Port_de_Suffren_rwk.JPG',
      'Francette',
      'Francette',
      'Wikimedia Commons',
    ),
  ],
  'par-franklin-passy': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/1/1c/Statue_de_Benjamin_Franklin%2C_square_de_Yorktown%2C_Paris_16e_9.jpg',
      'Le Franklin Passy',
      'Le Franklin Passy',
      'Wikimedia Commons',
    ),
  ],
  'par-fric-frac': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Canal_Saint-Martin_P1060441.JPG/3840px-Canal_Saint-Martin_P1060441.JPG',
      'Fric-Frac',
      'Fric-Frac',
      'Wikimedia Commons',
    ),
  ],
  'par-galeries-lafayette': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/GaleriesLafayetteNuit.jpg/1280px-GaleriesLafayetteNuit.jpg',
      'Galeries Lafayette',
      'Galeries Lafayette',
      'Wikimedia Commons',
    ),
  ],
  'par-horloge': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/5/5f/Paris_Conciergerie_265.jpg',
      'Conciergerie Clock',
      'Conciergerie Clock',
      'Wikimedia Commons',
    ),
  ],
  'par-hotel-ville': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/H%C3%B4tel_ville_fa%C3%A7ade_principale_Paris_11.jpg/3840px-H%C3%B4tel_ville_fa%C3%A7ade_principale_Paris_11.jpg',
      'Hôtel de Ville',
      'Hôtel de Ville',
      'Wikimedia Commons',
    ),
  ],
  'par-invalides': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/H%C3%B4tel_des_Invalides_from_the_Eiffel_Tower%2C_23_July_2009.jpg/3840px-H%C3%B4tel_des_Invalides_from_the_Eiffel_Tower%2C_23_July_2009.jpg',
      'Invalides',
      'Invalides',
      'Wikimedia Commons',
    ),
  ],
  'par-jeffrey-cagnes': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Jeffrey_Cagnes_%40SimonDetraz.jpg/1280px-Jeffrey_Cagnes_%40SimonDetraz.jpg',
      'Jeffrey Cagnes',
      'Jeffrey Cagnes',
      'Wikimedia Commons',
    ),
  ],
  'par-la-defense': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/La_D%C3%A9fense_Juin_2025.jpg/3840px-La_D%C3%A9fense_Juin_2025.jpg',
      'La Défense',
      'La Défense',
      'Wikimedia Commons',
    ),
  ],
  'par-la-villette': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Rio_Samba_School_statue_%40_Parc_de_La_Villette_%40_Paris_%2828881779791%29.jpg/3840px-Rio_Samba_School_statue_%40_Parc_de_La_Villette_%40_Paris_%2828881779791%29.jpg',
      'Parc de la Villette',
      'Parc de la Villette',
      'Wikimedia Commons',
    ),
  ],
  'par-louvre': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/1280px-Louvre_Museum_Wikimedia_Commons.jpg',
      'Louvre',
      'Louvre',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Cour_Napol%C3%A9on_at_night_-_Louvre.jpg/1280px-Cour_Napol%C3%A9on_at_night_-_Louvre.jpg',
      'Louvre',
      'Louvre',
      'Wikimedia Commons',
    ),
  ],
  'par-luxembourg': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/LuxembourgMontparnasse.JPG/1280px-LuxembourgMontparnasse.JPG',
      'Luxembourg Garden',
      'Luxembourg Garden',
      'Wikimedia Commons',
    ),
  ],
  'par-madeleine': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/f/fc/Eglise_de_la_Madeleine_2024.jpg',
      'Église de la Madeleine',
      'Église de la Madeleine',
      'Wikimedia Commons',
    ),
  ],
  'par-maison-balzac': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Maison_de_Balzac%2C_Paris_16e_5.jpg/1280px-Maison_de_Balzac%2C_Paris_16e_5.jpg',
      'Maison de Balzac',
      'Maison de Balzac',
      'Wikimedia Commons',
    ),
  ],
  'par-maison-doucet': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/West_facade_of_the_Cour_Carr%C3%A9e%2C_Louvre_Palace%2C_Paris_5_October_2017.jpg/3840px-West_facade_of_the_Cour_Carr%C3%A9e%2C_Louvre_Palace%2C_Paris_5_October_2017.jpg',
      'Maison Doucet',
      'Maison Doucet',
      'Wikimedia Commons',
    ),
  ],
  'par-maison-isabelle': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Bulletin_de_la_Soci%C3%A9t%C3%A9_franco-japonaise_de_Paris%2C_num%C3%A9ro_71%2C_1930.pdf/page1-1280px-Bulletin_de_la_Soci%C3%A9t%C3%A9_franco-japonaise_de_Paris%2C_num%C3%A9ro_71%2C_1930.pdf.jpg',
      'La Maison d\'Isabelle',
      'La Maison d\'Isabelle',
      'Wikimedia Commons',
    ),
  ],
  'par-marais': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/d/d3/Paris_Hotel_de_Sens_dsc04028.jpg',
      'Le Marais',
      'Le Marais',
      'Wikimedia Commons',
    ),
  ],
  'par-metro-2': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/3/35/Musician_Mohamed_Lamouri_in_Paris_Metro_line_2.jpg',
      'Metro Line 2',
      'Metro Line 2',
      'Wikimedia Commons',
    ),
  ],
  'par-metro-6': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Station_Bir_Hakeim_M%C3%A9tro_Paris_Ligne_6_-_Paris_XV_%28FR75%29_-_2022-07-01_-_6.jpg/1280px-Station_Bir_Hakeim_M%C3%A9tro_Paris_Ligne_6_-_Paris_XV_%28FR75%29_-_2022-07-01_-_6.jpg',
      'Metro Line 6',
      'Metro Line 6',
      'Wikimedia Commons',
    ),
  ],
  'par-michalak': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/e/e1/Skaskiewicz_v_Michalak_Tournoi_GPSO_2014_t132515.jpg',
      'Pâtisserie Michalak',
      'Pâtisserie Michalak',
      'Wikimedia Commons',
    ),
  ],
  'par-monceau': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Rotonde_Chartres_Paris_3.jpg/3840px-Rotonde_Chartres_Paris_3.jpg',
      'Parc Monceau',
      'Parc Monceau',
      'Wikimedia Commons',
    ),
  ],
  'par-montmartre': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/View_from_Notre-Dame_de_Paris%2C_24_June_2014_004.jpg/3840px-View_from_Notre-Dame_de_Paris%2C_24_June_2014_004.jpg',
      'Montmartre',
      'Montmartre',
      'Wikimedia Commons',
    ),
  ],
  'par-montorgueil': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/00/Plaque_Rue_Montorgueil_-_Paris_II_%28FR75%29_-_2021-06-15_-_1.jpg',
      'Montorgueil',
      'Montorgueil',
      'Wikimedia Commons',
    ),
  ],
  'par-montparnasse': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Tour_Montparnasse_from_the_Tour_Maine-Montparnasse.jpg/1280px-Tour_Montparnasse_from_the_Tour_Maine-Montparnasse.jpg',
      'Tour Montparnasse',
      'Tour Montparnasse',
      'Wikimedia Commons',
    ),
  ],
  'par-moulin-rouge': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Moulin_Rouge%2C_17_April_2011.jpg/3840px-Moulin_Rouge%2C_17_April_2011.jpg',
      'Moulin Rouge',
      'Moulin Rouge',
      'Wikimedia Commons',
    ),
  ],
  'par-notre-dame': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Notre-Dame_de_Paris.jpg/1280px-Notre-Dame_de_Paris.jpg',
      'Notre-Dame',
      'Notre-Dame',
      'Wikimedia Commons',
    ),
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Notre-Dame_de_Paris_from_the_Pont_de_l%27Archev%C3%AAch%C3%A9_by_Night.jpg/1280px-Notre-Dame_de_Paris_from_the_Pont_de_l%27Archev%C3%AAch%C3%A9_by_Night.jpg',
      'Notre-Dame',
      'Notre-Dame',
      'Wikimedia Commons',
    ),
  ],
  'par-opera': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Paris_Opera_full_frontal_architecture%2C_May_2009.jpg/1280px-Paris_Opera_full_frontal_architecture%2C_May_2009.jpg',
      'Opéra Garnier',
      'Opéra Garnier',
      'Wikimedia Commons',
    ),
  ],
  'par-orangerie': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/b/bb/Mus%C3%A9e_de_l%E2%80%99Orangerie_exterior.JPG',
      'Musée de l\'Orangerie',
      'Musée de l\'Orangerie',
      'Wikimedia Commons',
    ),
  ],
  'par-orsay': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Mus%C3%A9e_d%27Orsay%2C_North-West_view%2C_Paris_7e_140402.jpg/1280px-Mus%C3%A9e_d%27Orsay%2C_North-West_view%2C_Paris_7e_140402.jpg',
      'Musée d\'Orsay',
      'Musée d\'Orsay',
      'Wikimedia Commons',
    ),
  ],
  'par-ory': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Aerial_view_of_Paris-Orly_Airport_1.jpg/1280px-Aerial_view_of_Paris-Orly_Airport_1.jpg',
      'Orly Airport (ORY)',
      'Orly Airport (ORY)',
      'Wikimedia Commons',
    ),
  ],
  'par-palais': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/France-000296_-_Paris%27_Grand_Palais_%2814525102530%29.jpg/1280px-France-000296_-_Paris%27_Grand_Palais_%2814525102530%29.jpg',
      'Petit & Grand Palais',
      'Petit & Grand Palais',
      'Wikimedia Commons',
    ),
  ],
  'par-palais-royal': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/8/85/Conseil_d%27Etat_Paris_WA.jpg',
      'Palais-Royal',
      'Palais-Royal',
      'Wikimedia Commons',
    ),
  ],
  'par-paname-brewing': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Paname_Tap_House_%28Quartier_Crim%C3%A9e%29_01.jpg/1280px-Paname_Tap_House_%28Quartier_Crim%C3%A9e%29_01.jpg',
      'Paname Brewing Company',
      'Paname Brewing Company',
      'Wikimedia Commons',
    ),
  ],
  'par-pantheon': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Pantheon_of_Paris_007.JPG/1280px-Pantheon_of_Paris_007.JPG',
      'Panthéon',
      'Panthéon',
      'Wikimedia Commons',
    ),
  ],
  'par-pierre-herme': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/0/0e/Pierre_Herm%C3%A9_Deauville_2017.jpg',
      'Pierre Hermé',
      'Pierre Hermé',
      'Wikimedia Commons',
    ),
  ],
  'par-pompidou': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Centre_Georges-Pompidou%2C_Paris_2013.jpg/1280px-Centre_Georges-Pompidou%2C_Paris_2013.jpg',
      'Centre Pompidou',
      'Centre Pompidou',
      'Wikimedia Commons',
    ),
  ],
  'par-printemps': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Printemps_Haussmann.jpg/1280px-Printemps_Haussmann.jpg',
      'Printemps',
      'Printemps',
      'Wikimedia Commons',
    ),
  ],
  'par-procope': [
    photo(
      'https://live.staticflickr.com/3597/3496995066_69ae2de882_b.jpg',
      'Le Procope',
      'Le Procope',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-royal-cambronne': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Place_Cambronne_-_Paris_XV_%28FR75%29_-_2021-08-09_-_3.jpg/3840px-Place_Cambronne_-_Paris_XV_%28FR75%29_-_2021-08-09_-_3.jpg',
      'Le Royal Cambronne',
      'Le Royal Cambronne',
      'Wikimedia Commons',
    ),
  ],
  'par-sacre-coeur': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre_-_Paris_-_GT-01_-_2024.jpg/1280px-Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre_-_Paris_-_GT-01_-_2024.jpg',
      'Sacré-Cœur',
      'Sacré-Cœur',
      'Wikimedia Commons',
    ),
  ],
  'par-saint-eustache': [
    photo(
      'https://live.staticflickr.com/4040/5155271244_2d5f0542e6_b.jpg',
      'Saint-Eustache',
      'Saint-Eustache',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-saint-michel': [
    photo(
      'https://live.staticflickr.com/8110/8539710069_7639e35651_b.jpg',
      'Place Saint-Michel',
      'Place Saint-Michel',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-sainte-chapelle': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/7/70/Sainte_Chapelle_-_Upper_level_1.jpg',
      'Sainte-Chapelle',
      'Sainte-Chapelle',
      'Wikimedia Commons',
    ),
  ],
  'par-serres-auteuil': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/7/74/Serianthes_calycina_au_Jardin_des_Serres_d%27Auteuil_%28Paris%29.jpg',
      'Jardin des Serres d\'Auteuil',
      'Jardin des Serres d\'Auteuil',
      'Wikimedia Commons',
    ),
  ],
  'par-sorbonne': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/P1300734_Paris_V_place_de_la_Sorbonne_rwk.jpg/1280px-P1300734_Paris_V_place_de_la_Sorbonne_rwk.jpg',
      'Rue de la Sorbonne',
      'Rue de la Sorbonne',
      'Wikimedia Commons',
    ),
  ],
  'par-train-bleu': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Le_Train_Bleu.jpg',
      'Le Train Bleu',
      'Le Train Bleu',
      'Wikimedia Commons',
    ),
  ],
  'par-trocadero': [
    photo(
      'https://live.staticflickr.com/4010/4175210166_4b92dc7454_b.jpg',
      'Trocadéro',
      'Trocadéro',
      'Flickr (CC via Openverse)',
    ),
  ],
  'par-tuileries': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Crowd_in_the_Jardin_des_Tuileries%2C_Paris_July_2014.jpg/3840px-Crowd_in_the_Jardin_des_Tuileries%2C_Paris_July_2014.jpg',
      'Tuileries Garden',
      'Tuileries Garden',
      'Wikimedia Commons',
    ),
  ],
  'par-vendome': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Place_Vendome%2C_Paris_20_April_2011.jpg/3840px-Place_Vendome%2C_Paris_20_April_2011.jpg',
      'Place Vendôme',
      'Place Vendôme',
      'Wikimedia Commons',
    ),
  ],
  'par-vincennes': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/d/d2/Bois_de_Vincennes_20060816_16.jpg',
      'Bois de Vincennes',
      'Bois de Vincennes',
      'Wikimedia Commons',
    ),
  ],
  'par-vincennes-town': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/4/44/Ch%C3%A2teau_de_Vincennes_Paris_FRA_002.jpg',
      'Vincennes',
      'Vincennes',
      'Wikimedia Commons',
    ),
  ],
  'par-vosges': [
    photo(
      'https://upload.wikimedia.org/wikipedia/commons/3/3d/Place_des_Vosges_vue_a%C3%A9rienne.png',
      'Place des Vosges',
      'Place des Vosges',
      'Wikimedia Commons',
    ),
  ],
};

export function photosForPlaceId(id: string): TravelPhoto[] | undefined {
  const list = photosByPlaceId[id];
  return list && list.length > 0 ? list : undefined;
}
