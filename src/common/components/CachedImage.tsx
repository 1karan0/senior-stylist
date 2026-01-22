import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, Platform, StyleSheet, View } from 'react-native';
import type { ImageErrorEventData, NativeSyntheticEvent } from 'react-native';

import { getCachedImageUri } from '@/services/imageCache';

type CachedImageProps = Omit<ImageProps, 'source'> & {
  source: { uri?: string } | number;
};

const CachedImage: React.FC<CachedImageProps> = ({
  source,
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  ...props
}) => {
  const uri = typeof source === 'object' ? source.uri : undefined;
  const [resolvedUri, setResolvedUri] = useState<string | undefined>(uri);
  const [loading, setLoading] = useState(Boolean(uri));
  const [lastLoadedUri, setLastLoadedUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    setResolvedUri(uri);
    if (!uri) {
      setLoading(false);
    }

    if (!uri || Platform.OS === 'web') {
      return () => {
        active = false;
      };
    }

    getCachedImageUri(uri)
      .then((cached) => {
        if (!active) return;
        setResolvedUri(cached ?? uri);
      })
      .catch(() => {
        if (!active) return;
        setResolvedUri(uri);
      });

    return () => {
      active = false;
    };
  }, [uri]);

  useEffect(() => {
    if (!resolvedUri) {
      setLoading(false);
      return;
    }

    if (resolvedUri === lastLoadedUri) {
      setLoading(false);
      return;
    }

    setLoading(true);
  }, [lastLoadedUri, resolvedUri]);

  if (typeof source === 'number') {
    return <Image source={source} style={style} {...props} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: resolvedUri }}
        style={style}
        onLoad={() => {
          if (resolvedUri) {
            setLastLoadedUri(resolvedUri);
          }
          setLoading(false);
        }}
        onLoadStart={() => {
          setLoading(true);
          onLoadStart?.();
        }}
        onLoadEnd={() => {
          setLoading(false);
          onLoadEnd?.();
        }}
        onError={(event: NativeSyntheticEvent<ImageErrorEventData>) => {
          setLoading(false);
          onError?.(event);
        }}
        {...props}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="small" color="#27B07D" />
        </View>
      ) : null}
    </View>
  );
};

export default CachedImage;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
