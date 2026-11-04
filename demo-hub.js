import {renderCRM} from './crm-view.js';

// Entrada única: a página inicial É o próprio sistema da igreja.
// CRM, site institucional e operação são seções do mesmo ambiente.
export function renderDemoHub(raw,demoId){return renderCRM(raw,{demoId});}
