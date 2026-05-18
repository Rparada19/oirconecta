/**
 * Cálculo de `DirectoryProfile.rankingScore`.
 *
 * Score = pesos × señales normalizadas. Todas las señales caen al rango [0,1]
 * antes de ponderarse, para que ningún factor domine numéricamente.
 *
 *   0.40 · ratingNorm      = ratingAvg / 5
 *   0.20 · reviewsNorm     = log1p(reviewsCount) / log1p(50)  // se satura ~50 reviews
 *   0.20 · completenessNorm = completeness / 100
 *   0.10 · viewsNorm       = log1p(viewsCount30d) / log1p(500)  // se satura ~500 visitas
 *   0.10 · activityNorm    = 1 si updatedAt < 30d, decae lineal a 0 a los 180d
 *
 * Mantén los pesos sumando 1.0; el resultado queda en [0,1] y se puede
 * usar directamente en `ORDER BY rankingScore DESC`.
 */

const WEIGHTS = {
  rating: 0.4,
  reviews: 0.2,
  completeness: 0.2,
  views: 0.1,
  activity: 0.1,
};

const LOG_REVIEWS_CAP = Math.log1p(50);
const LOG_VIEWS_CAP = Math.log1p(500);

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function activityNorm(updatedAt) {
  if (!updatedAt) return 0;
  const ageDays = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 30) return 1;
  if (ageDays >= 180) return 0;
  return 1 - (ageDays - 30) / 150;
}

/**
 * Calcula el score (sin escribir nada). Acepta un objeto plano con los campos
 * relevantes — útil para tests sin DB.
 */
function computeRankingScore(profile) {
  const ratingNorm = clamp01((profile.ratingAvg || 0) / 5);
  const reviewsNorm = clamp01(Math.log1p(profile.reviewsCount || 0) / LOG_REVIEWS_CAP);
  const completenessNorm = clamp01((profile.completeness || 0) / 100);
  const viewsNorm = clamp01(Math.log1p(profile.viewsCount30d || 0) / LOG_VIEWS_CAP);
  const activityN = clamp01(activityNorm(profile.updatedAt));

  return (
    WEIGHTS.rating * ratingNorm +
    WEIGHTS.reviews * reviewsNorm +
    WEIGHTS.completeness * completenessNorm +
    WEIGHTS.views * viewsNorm +
    WEIGHTS.activity * activityN
  );
}

/**
 * Calcula la completitud de un perfil (0-100). Útil para guiar al profesional
 * sobre qué falta antes de pedir aprobación.
 */
function computeCompleteness(profile) {
  const checks = [
    !!profile.fotoPerfilUrl,
    !!profile.bannerUrl || (profile.photoUrls && profile.photoUrls.length > 0),
    !!profile.nombreConsultorio,
    !!profile.profesion || !!profile.professionId,
    !!profile.telefonoPublico,
    !!profile.emailPublico,
    !!profile.direccionPublica,
    !!profile.googleMapsEmbedUrl || !!profile.googleMapsLugarUrl,
    !!profile.consultation,
    !!profile.availability,
    Array.isArray(profile.studies) ? profile.studies.length > 0 : !!profile.studies,
    Array.isArray(profile.polizasAceptadas) && profile.polizasAceptadas.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

/**
 * Recalcula y persiste `rankingScore` (y `completeness`) de un perfil.
 * Usa Prisma del caller para no abrir conexiones extra.
 */
async function recalcRankingForProfile(prisma, profileId) {
  const profile = await prisma.directoryProfile.findUnique({ where: { id: profileId } });
  if (!profile) return null;
  const completeness = computeCompleteness(profile);
  const rankingScore = computeRankingScore({ ...profile, completeness });
  return prisma.directoryProfile.update({
    where: { id: profileId },
    data: { completeness, rankingScore },
  });
}

module.exports = {
  WEIGHTS,
  computeRankingScore,
  computeCompleteness,
  recalcRankingForProfile,
};
