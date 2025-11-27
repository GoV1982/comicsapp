/**
 * Utilidad para calcular similitud entre cómics basada en género, editorial y subgénero
 */

/**
 * Calcula la similitud de Jaccard entre dos sets
 * @param {Set} setA - Primer set
 * @param {Set} setB - Segundo set
 * @returns {number} - Similitud entre 0 y 1
 */
function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Calcula la similitud entre dos cómics
 * @param {Object} comic1 - Primer cómic
 * @param {Object} comic2 - Segundo cómic
 * @returns {number} - Similitud entre 0 y 1
 */
function calculateComicSimilarity(comic1, comic2) {
  // Crear sets de atributos para comparación
  const attributes1 = new Set();
  const attributes2 = new Set();

  // Agregar género (normalizado a minúsculas)
  if (comic1.genero) attributes1.add(comic1.genero.toLowerCase().trim());
  if (comic2.genero) attributes2.add(comic2.genero.toLowerCase().trim());

  // Agregar editorial (normalizado)
  if (comic1.editorial_id) attributes1.add(`editorial_${comic1.editorial_id}`);
  if (comic2.editorial_id) attributes2.add(`editorial_${comic2.editorial_id}`);

  // Agregar subgénero si existe
  if (comic1.subgenero) attributes1.add(comic1.subgenero.toLowerCase().trim());
  if (comic2.subgenero) attributes2.add(comic2.subgenero.toLowerCase().trim());

  // Calcular similitud de Jaccard
  return jaccardSimilarity(attributes1, attributes2);
}

/**
 * Encuentra cómics similares a los favoritos de un usuario
 * @param {Array} userFavorites - Array de IDs de cómics favoritos del usuario
 * @param {Array} allComics - Array de todos los cómics disponibles
 * @param {number} threshold - Umbral de similitud mínimo (0-1)
 * @param {number} maxResults - Máximo número de resultados por favorito
 * @returns {Array} - Array de objetos con comic_id y similares
 */
function findSimilarComics(userFavorites, allComics, threshold = 0.3, maxResults = 5) {
  const similarComics = [];

  // Crear mapa de cómics por ID para acceso rápido
  const comicsMap = new Map();
  allComics.forEach(comic => comicsMap.set(comic.id, comic));

  // Para cada favorito del usuario
  userFavorites.forEach(favoriteId => {
    const favoriteComic = comicsMap.get(favoriteId);
    if (!favoriteComic) return;

    const similarForThisComic = [];

    // Comparar con todos los demás cómics
    allComics.forEach(comic => {
      // No comparar consigo mismo
      if (comic.id === favoriteId) return;

      // No recomendar cómics que ya son favoritos
      if (userFavorites.includes(comic.id)) return;

      const similarity = calculateComicSimilarity(favoriteComic, comic);

      if (similarity >= threshold) {
        similarForThisComic.push({
          comic_id: comic.id,
          similarity: similarity,
          comic: comic
        });
      }
    });

    // Ordenar por similitud descendente y limitar resultados
    similarForThisComic.sort((a, b) => b.similarity - a.similarity);
    const topSimilar = similarForThisComic.slice(0, maxResults);

    if (topSimilar.length > 0) {
      similarComics.push({
        favorite_comic_id: favoriteId,
        similar_comics: topSimilar
      });
    }
  });

  return similarComics;
}

/**
 * Encuentra nuevos cómics similares desde la última notificación
 * @param {Array} userFavorites - Favoritos del usuario
 * @param {Array} allComics - Todos los cómics
 * @param {Date} lastNotificationDate - Fecha de la última notificación
 * @param {number} threshold - Umbral de similitud
 * @param {number} maxResults - Máximo resultados
 * @returns {Array} - Nuevos cómics similares
 */
function findNewSimilarComics(userFavorites, allComics, lastNotificationDate, threshold = 0.3, maxResults = 10) {
  // Filtrar solo cómics nuevos (creados después de la última notificación)
  const newComics = allComics.filter(comic => {
    const comicDate = new Date(comic.fecha_creacion);
    return comicDate > lastNotificationDate;
  });

  if (newComics.length === 0) return [];

  // Encontrar similares entre nuevos cómics y favoritos
  const similarComics = findSimilarComics(userFavorites, newComics, threshold, maxResults);

  // Aplanar resultados
  const newSimilarComics = [];
  similarComics.forEach(group => {
    group.similar_comics.forEach(similar => {
      newSimilarComics.push({
        comic_id: similar.comic_id,
        similarity: similar.similarity,
        favorite_comic_id: group.favorite_comic_id,
        comic: similar.comic
      });
    });
  });

  // Ordenar por similitud y limitar
  newSimilarComics.sort((a, b) => b.similarity - a.similarity);
  return newSimilarComics.slice(0, maxResults);
}

module.exports = {
  calculateComicSimilarity,
  findSimilarComics,
  findNewSimilarComics
};
