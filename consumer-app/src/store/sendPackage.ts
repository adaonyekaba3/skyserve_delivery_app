import { create } from 'zustand';
import type {
  DeliveryPriority,
  PackageCategory,
  PackageWeightClass,
  RecipientLookup,
} from '../services/types';

export interface SendPackageDraft {
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  pickupLatitude?: string;
  pickupLongitude?: string;
  recipientPhone: string;
  recipientName: string;
  recipientLookup: RecipientLookup | null;
  category: PackageCategory;
  weightClass: PackageWeightClass;
  isFragile: boolean;
  description: string;
  dropoffAddress: string;
  dropoffLatitude?: string;
  dropoffLongitude?: string;
  deliveryPriority: DeliveryPriority;
}

const EMPTY: SendPackageDraft = {
  senderName: '',
  senderPhone: '',
  pickupAddress: '',
  pickupLatitude: undefined,
  pickupLongitude: undefined,
  recipientPhone: '',
  recipientName: '',
  recipientLookup: null,
  category: 'parcel',
  weightClass: 'light',
  isFragile: false,
  description: '',
  dropoffAddress: '',
  dropoffLatitude: undefined,
  dropoffLongitude: undefined,
  deliveryPriority: 'standard',
};

interface SendPackageState {
  draft: SendPackageDraft;
  set: (patch: Partial<SendPackageDraft>) => void;
  setRecipientLookup: (lookup: RecipientLookup | null) => void;
  reset: () => void;
}

export const useSendPackage = create<SendPackageState>((set) => ({
  draft: { ...EMPTY },
  set: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setRecipientLookup: (lookup) =>
    set((s) => ({
      draft: {
        ...s.draft,
        recipientLookup: lookup,
        recipientName:
          (s.draft.recipientName?.trim() || lookup?.name) ?? s.draft.recipientName,
        dropoffAddress: lookup?.address || s.draft.dropoffAddress,
        dropoffLatitude: lookup?.latitude ?? s.draft.dropoffLatitude,
        dropoffLongitude: lookup?.longitude ?? s.draft.dropoffLongitude,
      },
    })),
  reset: () => set({ draft: { ...EMPTY } }),
}));
