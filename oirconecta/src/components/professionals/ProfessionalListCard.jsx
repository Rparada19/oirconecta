import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGlobe } from 'react-icons/fa';

function initialsFromName(nombre) {
  if (!nombre || typeof nombre !== 'string') return '—';
  const words = nombre.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function firstTelHref(telefono) {
  if (!telefono || typeof telefono !== 'string') return null;
  const chunk = telefono.split(/[/|,]/)[0].trim().replace(/\s/g, '');
  if (chunk.replace(/\D/g, '').length < 6) return null;
  return `tel:${chunk}`;
}

/**
 * Tarjeta de listado para directorio de profesionales (audiólogas / otólogos).
 * @param {{ professional: object, roleLabel: string, toProfile: string }} props
 */
export default function ProfessionalListCard({ professional, roleLabel, toProfile }) {
  const navigate = useNavigate();
  const {
    nombre,
    ciudad,
    telefono,
    email,
    prepagadas,
    servicios,
    foto,
    sitioWeb,
  } = professional;

  const initials = initialsFromName(nombre);
  const telHref = firstTelHref(telefono);
  const fotoUrl = typeof foto === 'string' && foto.trim().startsWith('http') ? foto.trim() : null;

  const goProfile = () => navigate(toProfile);

  const stop = (e) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goProfile();
    }
  };

  const web = typeof sitioWeb === 'string' && sitioWeb.trim().length > 4 ? sitioWeb.trim() : null;
  const showSocialRow = Boolean(web);

  return (
    <article
      className="professional-card"
      role="button"
      tabIndex={0}
      aria-label={`Ver perfil de ${nombre}, ${roleLabel} en ${ciudad || 'Colombia'}`}
      onClick={goProfile}
      onKeyDown={handleKeyDown}
    >
      <div className="card-header">
        <div className="card-image-container">
          <div className={`card-image ${fotoUrl ? 'card-image--has-photo' : ''}`}>
            {fotoUrl ? (
              <img src={fotoUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="professional-card-initials" aria-hidden>
                {initials}
              </span>
            )}
          </div>
        </div>
        <div className="professional-card-network-badge">En la red OírConecta</div>
      </div>

      <div className="card-content">
        <div className="specialty-badge">{roleLabel}</div>
        <h3 className="professional-name">
          <b>{nombre}</b>
        </h3>
        <div className="location-info">
          <span className="professional-card-city">{ciudad || 'Ciudad no indicada'}</span>
        </div>

        <div className="professional-card-contact">
          {telefono ? (
            telHref ? (
              <a href={telHref} className="professional-card-contact-line" onClick={stop}>
                {telefono}
              </a>
            ) : (
              <span className="professional-card-contact-muted">{telefono}</span>
            )
          ) : (
            <span className="professional-card-contact-muted">Teléfono no disponible</span>
          )}
          {email ? (
            <a href={`mailto:${email}`} className="professional-card-contact-line" onClick={stop}>
              {email}
            </a>
          ) : (
            <span className="professional-card-contact-muted">Email en perfil</span>
          )}
        </div>

        {prepagadas && prepagadas.length > 0 && (
          <div className="professional-card-chips-block">
            <span className="professional-card-chips-label">Prepagadas</span>
            <div className="professional-card-chips">
              {prepagadas.slice(0, 3).map((p) => (
                <span key={p} className="professional-card-chip professional-card-chip--muted">
                  {p}
                </span>
              ))}
              {prepagadas.length > 3 && (
                <span className="professional-card-chip professional-card-chip--more">
                  +{prepagadas.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {servicios && servicios.length > 0 && (
          <div className="professional-card-chips-block">
            <span className="professional-card-chips-label">Servicios</span>
            <div className="professional-card-chips professional-card-chips--services">
              {servicios.slice(0, 3).map((s) => (
                <span key={s} className="professional-card-chip professional-card-chip--service">
                  {s}
                </span>
              ))}
              {servicios.length > 3 && (
                <span className="professional-card-chip professional-card-chip--more">+{servicios.length - 3}</span>
              )}
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button
            type="button"
            className="btn-contact"
            onClick={(e) => {
              stop(e);
              goProfile();
            }}
          >
            Ver perfil
          </button>
          {telHref ? (
            <a href={telHref} className="btn-contact" onClick={stop}>
              Llamar
            </a>
          ) : (
            <button type="button" className="btn-profile" disabled>
              Llamar
            </button>
          )}
          <button
            type="button"
            className="btn-profile"
            onClick={(e) => {
              stop(e);
              navigate('/agendar');
            }}
          >
            Agendar cita
          </button>
        </div>

        {showSocialRow && (
          <>
            <p className="professional-card-social-title">Web</p>
            <div className="professional-card-social">
              <a
                href={web.startsWith('http') ? web : `https://${web}`}
                target="_blank"
                rel="noopener noreferrer"
                className="professional-card-social-link"
                aria-label="Sitio web"
                onClick={stop}
              >
                <FaGlobe size={16} />
              </a>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
