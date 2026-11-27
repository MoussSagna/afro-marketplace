import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullScreenModal } from '@/components/FullScreenModal';
import { Photo, Text } from '@/components/ui';

/** La hauteur de la galerie en haut du profil (maquette P5). */
export const GALLERY_HEIGHT = 300;
const INK = '#2B1A12';

type ProfileGalleryProps = {
  /** Les adresses des photos, la couverture d'abord. */
  photos: string[];
  name: string;
};

/** La photo affichée quand on a fini de glisser (page = largeur de l'écran). */
function pageOf(event: NativeSyntheticEvent<NativeScrollEvent>, width: number) {
  return Math.round(event.nativeEvent.contentOffset.x / width);
}

/**
 * La galerie du profil (maquette P5) : les photos défilent de côté, une par page,
 * avec le compteur « 1 / 8 photos » et le bouton Retour par-dessus.
 * Toucher une photo l'ouvre en grand (PhotoViewer).
 */
export function ProfileGallery({ photos, name }: ProfileGalleryProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const count = Math.max(photos.length, 1);

  return (
    <View style={{ height: GALLERY_HEIGHT }} accessibilityLabel={t('profile.gallery', { name })}>
      {photos.length ? (
        <FlatList
          data={photos}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setIndex(pageOf(event, width))}
          renderItem={({ item, index: i }) => (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={t('profile.openPhoto', { index: i + 1, count: photos.length })}
              onPress={() => setViewerAt(i)}
            >
              <Photo uri={item} style={{ width, height: GALLERY_HEIGHT }} />
            </Pressable>
          )}
        />
      ) : (
        <Photo className="h-full w-full" />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        style={{ top: insets.top + 8, backgroundColor: 'rgba(253, 247, 240, 0.92)' }}
      >
        <ChevronLeft size={22} color={INK} />
      </Pressable>
      <View
        className="absolute bottom-8 right-3.5 rounded-full px-2.5 py-1"
        style={{ backgroundColor: 'rgba(43, 26, 18, 0.7)' }}
      >
        <Text size="xs" weight="semibold" style={{ color: '#fff' }}>
          {t('profile.photos', { index: Math.min(index + 1, count), count })}
        </Text>
      </View>

      <PhotoViewer
        photos={photos}
        startAt={viewerAt}
        onClose={(last) => {
          setViewerAt(null);
          setIndex(last);
        }}
      />
    </View>
  );
}

type PhotoViewerProps = {
  photos: string[];
  /** La photo à ouvrir, ou null quand la visionneuse est fermée. */
  startAt: number | null;
  /** Rend la dernière photo regardée, pour que la galerie s'y place. */
  onClose(lastIndex: number): void;
};

/** La visionneuse plein écran, sur fond noir : on glisse entre les photos, la croix referme. */
function PhotoViewer({ photos, startAt, onClose }: PhotoViewerProps) {
  return (
    <FullScreenModal
      visible={startAt !== null}
      onClose={() => onClose(startAt ?? 0)}
      animationType="fade"
    >
      <ViewerBody photos={photos} startAt={startAt ?? 0} onClose={onClose} />
    </FullScreenModal>
  );
}

function ViewerBody({
  photos,
  startAt,
  onClose,
}: Omit<PhotoViewerProps, 'startAt'> & { startAt: number }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(startAt);
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: '#000' }}
      accessibilityLabel={t('profile.viewer')}
    >
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.closeViewer')}
          onPress={() => onClose(index)}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <X size={22} color="#fff" />
        </Pressable>
        <Text size="sm" weight="semibold" style={{ color: '#fff' }}>
          {`${index + 1} / ${photos.length}`}
        </Text>
        <View className="w-11" />
      </View>
      <FlatList
        data={photos}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startAt}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(event) => setIndex(pageOf(event, width))}
        renderItem={({ item }) => (
          <Photo
            uri={item}
            contentFit="contain"
            style={{ width, height: '100%', backgroundColor: '#000' }}
          />
        )}
      />
    </SafeAreaView>
  );
}
