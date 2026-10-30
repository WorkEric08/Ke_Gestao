import type { CapacitorConfig } from '@capacitor/cli';

// ATENÇÃO: `appId` identifica o app no Android. Mudá-lo cria OUTRO app (o instalado não é atualizado e os dados
// ficam para trás). Renomear o produto é só texto de tela, manifest e strings.xml, nunca o appId.
const config: CapacitorConfig = {
  appId: 'com.kegestao.app',
  appName: 'Ke Gestão',
  webDir: 'dist',
  backgroundColor: '#000000',
  android: {
    // O app só fala com o próprio pacote: nada de conteúdo misto nem de depuração da WebView em produção.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  }
};

export default config;
