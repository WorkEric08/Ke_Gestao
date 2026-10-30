import { App } from '@capacitor/app';
import { isNative } from './platform';

// Registra o tratador do botão "voltar" do Android. `handler` devolve true se tratou (navegou) e false se
// não há para onde voltar: aí o app fecha. Devolve a função que desfaz o registro. Fora do nativo não faz nada.
export const onBackButton = (handler: () => boolean): (() => void) => {
  if (!isNative()) return () => {};
  const registration = App.addListener('backButton', () => {
    if (!handler()) void App.exitApp();
  });
  return () => {
    void registration.then((listener) => listener.remove());
  };
};
