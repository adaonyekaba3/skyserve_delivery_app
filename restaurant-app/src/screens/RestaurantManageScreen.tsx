import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Switch, Image, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import {
  createMenuItem,
  deleteMenuItem,
  getMe,
  getMenu,
  getRestaurant,
  updateMenuItem,
  updateRestaurant,
} from '../services/api';
import type { MenuItem, Restaurant } from '../services/types';
import {
  Screen,
  AppHeader,
  Card,
  Button,
  Input,
  Loader,
  Badge,
  EmptyState,
} from '../ui';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
const CLOUDINARY_ENABLED = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

async function uploadImageAsync(uri: string): Promise<string> {
  if (!CLOUDINARY_ENABLED) {
    throw new Error(
      'Image upload disabled: set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET, then restart Expo.',
    );
  }
  const form = new FormData();
  form.append('file', { uri, name: 'menu-item.jpg', type: 'image/jpeg' } as any);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) throw new Error('Image upload failed');
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error('Image upload returned no URL');
  return json.secure_url;
}

export default function RestaurantManageScreen() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const me = await getMe();
      const rid = me.restaurantIds[0];
      if (!rid) {
        setError('No restaurant linked to this account.');
        return;
      }
      setRestaurantId(rid);
      const [r, m] = await Promise.all([getRestaurant(rid), getMenu(rid)]);
      setRestaurant(r);
      setMenu(m);
      setName(r.name);
      setAddress(r.address);
      setLatitude(r.latitude);
      setLongitude(r.longitude);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRestaurant = async () => {
    if (!restaurantId) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRestaurant(restaurantId, { name, address, latitude, longitude });
      setRestaurant(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Please allow media library access to upload item images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadImageAsync(result.assets[0].uri);
      setItemImageUrl(uploaded);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resetMenuForm = () => {
    setEditingMenuId(null);
    setItemName('');
    setItemPrice('');
    setItemDescription('');
    setItemImageUrl('');
    setItemAvailable(true);
  };

  const saveMenuItem = async () => {
    if (!restaurantId) return;
    setBusy(true);
    setError(null);
    try {
      if (editingMenuId) {
        const updated = await updateMenuItem(editingMenuId, {
          name: itemName,
          description: itemDescription,
          imageUrl: itemImageUrl,
          price: itemPrice,
          isAvailable: itemAvailable,
        });
        setMenu((curr) => curr.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await createMenuItem({
          restaurantId,
          name: itemName,
          description: itemDescription,
          imageUrl: itemImageUrl || undefined,
          price: itemPrice,
          isAvailable: itemAvailable,
        });
        setMenu((curr) => [created, ...curr]);
      }
      resetMenuForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const editMenuItem = (item: MenuItem) => {
    setEditingMenuId(item.id);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemDescription(item.description ?? '');
    setItemImageUrl(item.imageUrl ?? '');
    setItemAvailable(item.isAvailable);
  };

  const removeMenuItem = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteMenuItem(id);
      setMenu((curr) => curr.filter((m) => m.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Manage" variant="large" />
        <Loader fullscreen label="Loading restaurant..." />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Manage" subtitle="Restaurant profile and menu" variant="large" />
      <FlatList
        data={menu}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <Card className="mb-4">
              <Text
                className="text-text text-base mb-3"
                style={{ fontFamily: 'Inter_600SemiBold' }}
              >
                Restaurant profile
              </Text>
              <Input label="Name" value={name} onChangeText={setName} containerClassName="mb-3" />
              <Input
                label="Address"
                value={address}
                onChangeText={setAddress}
                containerClassName="mb-3"
              />
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Input label="Latitude" value={latitude} onChangeText={setLatitude} />
                </View>
                <View className="flex-1">
                  <Input label="Longitude" value={longitude} onChangeText={setLongitude} />
                </View>
              </View>

              {restaurant && Number(restaurant.latitude) && Number(restaurant.longitude) ? (
                <View
                  className="rounded-lg overflow-hidden border border-border mb-3"
                  style={{ height: 160 }}
                >
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: Number(restaurant.latitude),
                      longitude: Number(restaurant.longitude),
                      latitudeDelta: 0.08,
                      longitudeDelta: 0.08,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: Number(restaurant.latitude),
                        longitude: Number(restaurant.longitude),
                      }}
                      title={restaurant.name}
                    />
                  </MapView>
                </View>
              ) : null}

              <Button
                label="Save restaurant"
                onPress={saveRestaurant}
                loading={busy}
                fullWidth
              />
            </Card>

            <Card className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-text text-base"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                >
                  {editingMenuId ? 'Edit menu item' : 'New menu item'}
                </Text>
                {editingMenuId ? (
                  <Pressable onPress={resetMenuForm} hitSlop={8}>
                    <Text
                      className="text-primary text-sm"
                      style={{ fontFamily: 'Inter_500Medium' }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <Input
                label="Item name"
                value={itemName}
                onChangeText={setItemName}
                containerClassName="mb-3"
              />
              <Input
                label="Price"
                placeholder="4500.00"
                value={itemPrice}
                onChangeText={setItemPrice}
                keyboardType="decimal-pad"
                containerClassName="mb-3"
              />
              <Input
                label="Description"
                value={itemDescription}
                onChangeText={setItemDescription}
                multiline
                style={{ minHeight: 60, textAlignVertical: 'top' }}
                containerClassName="mb-3"
              />
              <Input
                label="Image URL"
                value={itemImageUrl}
                onChangeText={setItemImageUrl}
                placeholder="Or upload below"
                autoCapitalize="none"
                containerClassName="mb-2"
              />
              <Button
                label={CLOUDINARY_ENABLED ? 'Pick / upload image' : 'Image upload disabled'}
                onPress={pickImage}
                variant="secondary"
                size="sm"
                disabled={busy || !CLOUDINARY_ENABLED}
                fullWidth
              />
              {!CLOUDINARY_ENABLED ? (
                <Text
                  className="text-subtle text-xs mt-2"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in
                  restaurant-app/.env to enable image upload.
                </Text>
              ) : null}
              {itemImageUrl ? (
                <Image
                  source={{ uri: itemImageUrl }}
                  style={{ width: '100%', height: 160, borderRadius: 12, marginTop: 12 }}
                  resizeMode="cover"
                />
              ) : null}
              <View className="flex-row items-center justify-between mt-3 mb-2">
                <Text
                  className="text-text text-sm"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  Available for ordering
                </Text>
                <Switch value={itemAvailable} onValueChange={setItemAvailable} />
              </View>
              <Button
                label={editingMenuId ? 'Update item' : 'Create item'}
                onPress={saveMenuItem}
                loading={busy}
                fullWidth
              />
            </Card>

            {error ? (
              <View className="bg-danger-soft rounded-md mb-4 px-3 py-2.5">
                <Text
                  className="text-danger text-sm"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <Text
              className="text-text text-base mb-2"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              Current menu
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="mb-3" padding="md">
            <View className="flex-row items-center">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: 56, height: 56, borderRadius: 10, marginRight: 12 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="bg-hairline rounded-md items-center justify-center mr-3"
                  style={{ width: 56, height: 56 }}
                >
                  <Text className="text-base">{'\uD83C\uDF7D'}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-text text-base"
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  className="text-muted text-xs mt-0.5"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {'\u20A6'}{Number(item.price).toLocaleString()}
                </Text>
                <View className="mt-1">
                  <Badge
                    label={item.isAvailable ? 'Available' : 'Unavailable'}
                    tone={item.isAvailable ? 'success' : 'neutral'}
                    size="sm"
                  />
                </View>
              </View>
            </View>
            <View className="flex-row gap-2 mt-3">
              <View className="flex-1">
                <Button
                  label="Edit"
                  onPress={() => editMenuItem(item)}
                  variant="secondary"
                  size="sm"
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Delete"
                  onPress={() => removeMenuItem(item.id)}
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  fullWidth
                />
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={'\uD83C\uDF7D'}
            title="No menu items yet"
            description="Add your first menu item using the form above."
          />
        }
      />
    </Screen>
  );
}
