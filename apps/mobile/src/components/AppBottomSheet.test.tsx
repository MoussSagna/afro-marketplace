import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBottomSheet, type AppBottomSheetRef } from './AppBottomSheet';
import { Button } from './ui';

/** Un iPhone (390 × 844) : le panneau lit les zones sûres. */
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={metrics}>{children}</SafeAreaProvider>
);

describe('AppBottomSheet (panneau du bas réutilisable)', () => {
  it('s’ouvre et se ferme par sa ref ; la croix ferme et prévient', async () => {
    const ref = createRef<AppBottomSheetRef>();
    const onDismiss = jest.fn();
    await render(
      <AppBottomSheet
        ref={ref}
        title="Filtres"
        onDismiss={onDismiss}
        headerRight={<Text>Réinitialiser</Text>}
        footer={<Button>Afficher</Button>}
      >
        <Text>Le contenu</Text>
      </AppBottomSheet>,
      { wrapper },
    );
    expect(screen.queryByText('Le contenu')).toBeNull();

    await act(() => ref.current?.present());
    expect(screen.getByRole('header', { name: 'Filtres' })).toBeOnTheScreen();
    expect(screen.getByText('Le contenu')).toBeOnTheScreen();
    expect(screen.getByText('Réinitialiser')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Afficher' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText('Le contenu')).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('avec un sous-écran : la flèche « Retour » remplace la croix et ne ferme pas', async () => {
    const ref = createRef<AppBottomSheetRef>();
    const onBack = jest.fn();
    await render(
      <AppBottomSheet ref={ref} title="Date" onBack={onBack} backLabel="Retour aux filtres">
        <Text>Calendrier</Text>
      </AppBottomSheet>,
      { wrapper },
    );
    await act(() => ref.current?.present());
    expect(screen.queryByRole('button', { name: 'Fermer' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Retour aux filtres' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Calendrier')).toBeOnTheScreen();
  });
});
