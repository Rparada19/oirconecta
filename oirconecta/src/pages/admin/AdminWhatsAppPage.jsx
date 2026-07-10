/**
 * F9d — Bandeja de WhatsApp para el equipo de captación de profesionales
 * al directorio. Filtra automáticamente por businessLine=DIRECTORIO.
 * URL: /portal-admin/whatsapp
 */

import React from 'react';
import WhatsAppInboxPage from '../crm/WhatsAppInboxPage';

export default function AdminWhatsAppPage() {
  return (
    <WhatsAppInboxPage
      businessLine="DIRECTORIO"
      title="Captación · WhatsApp"
      subtitle="+57 317 150 3944 · Profesionales del directorio"
    />
  );
}
