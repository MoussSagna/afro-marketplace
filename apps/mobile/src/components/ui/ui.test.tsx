import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';
import { Logo } from '../brand/Logo';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button, buttonTextVariants, buttonVariants } from './Button';
import { Chip } from './Chip';
import { EmptyState } from './EmptyState';
import { Input } from './Input';
import { Rating, ratingLabel } from './Rating';
import { Accent, Heading, Text } from './Text';

// Rappel : `render` est asynchrone avec Testing Library React Native 14.

describe('Button', () => {
  it('se touche et appelle onPress', async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}>Demander un devis</Button>);
    await fireEvent.press(screen.getByRole('button', { name: 'Demander un devis' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("ne répond pas quand il est désactivé, et l'annonce", async () => {
    const onPress = jest.fn();
    await render(
      <Button disabled onPress={onPress}>
        Envoyer
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Envoyer' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('affiche une roue de chargement et se bloque pendant un envoi', async () => {
    const onPress = jest.fn();
    await render(
      <Button loading onPress={onPress}>
        Envoyer
      </Button>,
    );
    expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
    const button = screen.getByRole('button', { name: 'Envoyer' });
    expect(button).toBeBusy();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('prend les couleurs de la maquette selon la variante', () => {
    expect(buttonVariants()).toContain('bg-cta');
    expect(buttonTextVariants()).toContain('text-cta-foreground');
    expect(buttonVariants({ variant: 'primary' })).toContain('bg-primary');
    expect(buttonVariants({ variant: 'outline' })).toContain('border-primary');
    expect(buttonTextVariants({ variant: 'outline' })).toContain('text-primary');
    expect(buttonVariants({ fullWidth: true })).toContain('w-full');
  });
});

describe('Text et Heading', () => {
  it('annonce un titre comme tel aux lecteurs d’écran, avec son mot accent', async () => {
    await render(
      <Heading>
        Explore nos <Accent>catégories</Accent>
      </Heading>,
    );
    expect(screen.getByRole('header')).toHaveTextContent('Explore nos catégories');
  });

  it('affiche le texte courant', async () => {
    await render(<Text tone="muted">Paris 18e</Text>);
    expect(screen.getByText('Paris 18e')).toBeOnTheScreen();
  });
});

describe('Input', () => {
  it('est trouvé par son libellé et transmet la saisie', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Email" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'aissatou@email.fr');
    expect(onChangeText).toHaveBeenCalledWith('aissatou@email.fr');
  });

  it("affiche l'erreur à la place de l'aide", async () => {
    await render(<Input label="Date" hint="Format JJ/MM/AAAA" error="Choisis une autre date." />);
    expect(screen.getByText('Choisis une autre date.')).toBeOnTheScreen();
    expect(screen.queryByText('Format JJ/MM/AAAA')).toBeNull();
    expect(screen.getByLabelText('Date')).toHaveProp('aria-invalid', true);
  });

  it("affiche l'aide quand il n'y a pas d'erreur", async () => {
    await render(<Input label="Email" hint="On ne le partage jamais." />);
    expect(screen.getByText('On ne le partage jamais.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Email')).toHaveProp('aria-invalid', false);
  });
});

describe('Chip', () => {
  it('indique si la pastille est choisie', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Chip selected onPress={onPress}>
          Sénégal
        </Chip>
        <Chip>Mali</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Sénégal' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Mali' })).not.toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: 'Sénégal' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Badge', () => {
  it('affiche son texte', async () => {
    await render(<Badge variant="success">Vérifié</Badge>);
    expect(screen.getByText('Vérifié')).toBeOnTheScreen();
  });
});

describe('Avatar', () => {
  it('affiche les initiales sans photo, et le nom pour VoiceOver', async () => {
    await render(<Avatar name="Aïssatou Diallo" />);
    expect(screen.getByRole('image', { name: 'Aïssatou Diallo' })).toBeOnTheScreen();
    expect(screen.getByText('AD')).toBeOnTheScreen();
  });

  it('affiche la photo quand il y en a une', async () => {
    await render(<Avatar name="Moussa Sow" uri="https://exemple.fr/photo.jpg" />);
    expect(screen.queryByText('MS')).toBeNull();
  });
});

describe('Rating', () => {
  it('lit la note en entier pour les lecteurs d’écran', async () => {
    await render(<Rating value={4.9} count={38} />);
    expect(screen.getByRole('image', { name: 'Note : 4,9 sur 5, 38 avis' })).toBeOnTheScreen();
    expect(screen.getByText('4,9')).toBeOnTheScreen();
    expect(screen.getByText('(38)')).toBeOnTheScreen();
  });

  it('affiche « Nouveau » sans avis', async () => {
    await render(<Rating value={0} count={0} />);
    expect(screen.getByText('Nouveau')).toBeOnTheScreen();
  });

  it('construit la phrase lue avec ou sans nombre d’avis', () => {
    expect(ratingLabel(4.5)).toBe('Note : 4,5 sur 5');
    expect(ratingLabel(4.5, 0)).toBe('Pas encore d’avis');
  });
});

describe('EmptyState', () => {
  it('affiche le titre, l’explication et l’action', async () => {
    await render(
      <EmptyState
        title="Pas encore de message"
        description="Envoie une demande de devis."
        action={<RNText>Trouver un prestataire</RNText>}
      />,
    );
    expect(screen.getByRole('header', { name: 'Pas encore de message' })).toBeOnTheScreen();
    expect(screen.getByText('Envoie une demande de devis.')).toBeOnTheScreen();
    expect(screen.getByText('Trouver un prestataire')).toBeOnTheScreen();
  });
});

describe('Logo', () => {
  it('est annoncé « Wenzee » dans toutes ses variantes', async () => {
    await render(
      <>
        <Logo />
        <Logo variant="light" />
        <Logo variant="symbol" />
      </>,
    );
    expect(screen.getAllByRole('image', { name: 'Wenzee' })).toHaveLength(3);
  });
});
