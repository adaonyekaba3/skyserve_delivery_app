import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MenuItem } from '../services/types';

interface Props {
  menuItem: MenuItem;
  inCart: number;
  onAdd: () => void;
}

export default function MenuItemRow({ menuItem, inCart, onAdd }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{menuItem.name}</Text>
        {menuItem.description ? <Text style={styles.desc}>{menuItem.description}</Text> : null}
        <Text style={styles.price}>₦{Number(menuItem.price).toLocaleString()}</Text>
      </View>
      <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
        <Text style={styles.addText}>{inCart > 0 ? `+ (${inCart})` : 'Add'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  name: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
  desc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  price: { fontSize: 14, color: '#0f172a', marginTop: 6, fontWeight: '500' },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    marginLeft: 12,
  },
  addText: { color: '#fff', fontWeight: '600' },
});
