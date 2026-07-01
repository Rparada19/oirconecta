/**
 * F5.5b — Mapeo de keys del backend (whitelist) a componentes MUI.
 * Mantén en sync con backend/src/services/iaAgentConfig.service.js#AGENT_ICONS.
 */

import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';

export const AGENT_ICON_MAP = {
  smart_toy:      SmartToyOutlinedIcon,
  auto_awesome:   AutoAwesomeOutlinedIcon,
  chat_bubble:    ChatBubbleOutlineOutlinedIcon,
  support_agent:  SupportAgentOutlinedIcon,
  headset_mic:    HeadsetMicOutlinedIcon,
  psychology:     PsychologyOutlinedIcon,
  handshake:      HandshakeOutlinedIcon,
  favorite:       FavoriteBorderOutlinedIcon,
  waving_hand:    WavingHandOutlinedIcon,
  star:           StarOutlineOutlinedIcon,
  spa:            SpaOutlinedIcon,
  bolt:           BoltOutlinedIcon,
};

export function getAgentIcon(key) {
  return AGENT_ICON_MAP[key] || SmartToyOutlinedIcon;
}

export const AGENT_ICON_LABELS = {
  smart_toy: 'Robot',
  auto_awesome: 'Destellos',
  chat_bubble: 'Burbuja',
  support_agent: 'Agente',
  headset_mic: 'Audífono',
  psychology: 'Mente',
  handshake: 'Saludo',
  favorite: 'Corazón',
  waving_hand: 'Hola',
  star: 'Estrella',
  spa: 'Bienestar',
  bolt: 'Rápido',
};
