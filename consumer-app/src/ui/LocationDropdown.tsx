import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Icon } from './Icon';

interface LocationDropdownProps {
  value: string;
  options?: string[];
  onChange?: (value: string) => void;
  className?: string;
}

const DEFAULT_OPTIONS = [
  'Ikoyi',
  'Banana Island',
  'Victoria Island',
  'Lekki Phase 1',
  'Eko Atlantic',
];

export function LocationDropdown({
  value,
  options = DEFAULT_OPTIONS,
  onChange,
  className = '',
}: LocationDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center gap-1 ${className}`}
      >
        <Icon name="map-pin" size={14} color="#C6A052" />
        <Text
          className="text-text text-sm"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          {value}
        </Text>
        <Icon name="chevron-down" size={14} color="#64748B" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-surface rounded-t-xl p-4 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="text-text text-base font-bold mb-3"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              Choose delivery area
            </Text>
            {options.map((opt) => {
              const active = opt === value;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onChange?.(opt);
                    setOpen(false);
                  }}
                  className={`flex-row items-center justify-between py-3 px-2 rounded-md ${
                    active ? 'bg-primary-soft' : ''
                  }`}
                >
                  <Text
                    className={`text-base ${active ? 'text-primary' : 'text-text'}`}
                    style={{
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }}
                  >
                    {opt}
                  </Text>
                  {active ? <Icon name="check" size={16} color="#0B1C2C" /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default LocationDropdown;
