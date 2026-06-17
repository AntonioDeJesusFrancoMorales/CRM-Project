import { empresasHandlers } from './empresas';
import { whatsappHandlers } from './whatsapp';
import { usuariosHandlers } from './usuarios';
import { rolesHandlers } from './roles';
import { contactosHandlers } from './contactos';
import { tratosHandlers } from './tratos';
import { tareasHandlers } from './tareas';
import { tablerosHandlers } from './tableros';
import { agendaHandlers } from './agenda';
import { etiquetasHandlers } from './etiquetas';
import { comentariosHandlers } from './comentarios';

export const handlers = [
  ...empresasHandlers,
  ...usuariosHandlers,
  ...rolesHandlers,
  ...contactosHandlers,
  ...tratosHandlers,
  ...tareasHandlers,
  ...tablerosHandlers,
  ...agendaHandlers,
  ...etiquetasHandlers,
  ...comentariosHandlers,
  ...whatsappHandlers,
];
