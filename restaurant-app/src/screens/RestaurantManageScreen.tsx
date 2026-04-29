import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
  form.append('file', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uri,
    name: 'menu-item.jpg',
    type: 'image/jpeg',
  } as any);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    throw new Error('Image upload failed');
  }
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) {
    throw new Error('Image upload returned no URL');
  }
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
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={menu}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>Restaurant profile</Text>
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Latitude"
              value={latitude}
              onChangeText={setLatitude}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Longitude"
              value={longitude}
              onChangeText={setLongitude}
            />
          </View>

          {restaurant ? (
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
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

          <TouchableOpacity style={styles.primaryBtn} onPress={saveRestaurant} disabled={busy}>
            <Text style={styles.primaryText}>Save restaurant</Text>
          </TouchableOpacity>

          <Text style={[styles.heading, { marginTop: 24 }]}>Menu item</Text>
          <TextInput style={styles.input} placeholder="Item name" value={itemName} onChangeText={setItemName} />
          <TextInput style={styles.input} placeholder="Price (e.g. 4500.00)" value={itemPrice} onChangeText={setItemPrice} />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={itemDescription}
            onChangeText={setItemDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Image URL (auto-filled if upload works)"
            value={itemImageUrl}
            onChangeText={setItemImageUrl}
          />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={pickImage}
            disabled={busy || !CLOUDINARY_ENABLED}
          >
            <Text style={styles.secondaryText}>
              {CLOUDINARY_ENABLED ? 'Pick/upload image' : 'Image upload disabled'}
            </Text>
          </TouchableOpacity>
          {!CLOUDINARY_ENABLED ? (
            <Text style={styles.hint}>
              Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in
              restaurant-app/.env to enable image upload.
            </Text>
          ) : null}
          {itemImageUrl ? <Image source={{ uri: itemImageUrl }} style={styles.preview} /> : null}
          <View style={styles.switchRow}>
            <Text style={styles.label}>Available</Text>
            <Switch value={itemAvailable} onValueChange={setItemAvailable} />
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={saveMenuItem} disabled={busy}>
            <Text style={styles.primaryText}>{editingMenuId ? 'Update item' : 'Create item'}</Text>
          </TouchableOpacity>
          {editingMenuId ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetMenuForm} disabled={busy}>
              <Text style={styles.secondaryText}>Cancel edit</Text>
            </TouchableOpacity>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={[styles.heading, { marginTop: 24 }]}>Current menu</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>₦{Number(item.price).toLocaleString()}</Text>
            <Text style={styles.itemMeta}>{item.isAvailable ? 'Available' : 'Unavailable'}</Text>
          </View>
          <TouchableOpacity onPress={() => editMenuItem(item)} style={styles.smallBtn}>
            <Text style={styles.smallText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeMenuItem(item.id)} style={styles.smallDangerBtn}>
            <Text style={styles.smallText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.itemMeta}>No menu items yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  mapWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: { height: 180, width: '100%' },
  primaryBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryText: { color: '#0f172a', fontWeight: '500' },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#334155', fontWeight: '500' },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  error: { color: '#b91c1c', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: { fontWeight: '600', color: '#0f172a' },
  itemMeta: { color: '#64748b' },
  smallBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  smallDangerBtn: { backgroundColor: '#fecaca', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  smallText: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
});
